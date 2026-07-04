import {
    BrowserProvider
} from "https://esm.sh/ethers@6";

import {
    NETWORK,
    STORAGE,
    getReadyNetworks,
    getCurrentNetwork,
    setCurrentNetwork,
    getNetworkByChainId,
    onNetworkChanged
} from "./config.js";

// =====================================================
// STATE
// =====================================================

let provider = null;
let signer = null;
let account = null;
let chainId = null;

let initialized = false;

const accountListeners = [];
const chainListeners = [];

// =====================================================
// HELPERS
// =====================================================

export function hasWallet() {

    return typeof window.ethereum !== "undefined";

}

export function getProvider() {

    return provider;

}

export function getSigner() {

    return signer;

}

export function getAccount() {

    return account;

}

export function getChainId() {

    return chainId;

}

export function isConnected() {

    return account !== null;

}

export function shortAddress(address) {

    if (!address) {

        return "";

    }

    return (
        address.slice(0, 6) +
        "..." +
        address.slice(-4)
    );

}

// =====================================================
// CALLBACKS
// =====================================================

export function onAccountChanged(callback) {

    if (typeof callback !== "function") {

        return;

    }

    accountListeners.push(
        callback
    );

}

export function onChainChanged(callback) {

    if (typeof callback !== "function") {

        return;

    }

    chainListeners.push(
        callback
    );

}

function emitAccountChanged(value) {

    for (const callback of accountListeners) {

        try {

            callback(value);

        }

        catch (error) {

            console.error(error);

        }

    }

}

function emitChainChanged(value) {

    for (const callback of chainListeners) {

        try {

            callback(value);

        }

        catch (error) {

            console.error(error);

        }

    }

}

// =====================================================
// UI
// =====================================================

export function updateWalletUI() {

    document
        .querySelectorAll(
            "#connectWallet, #connectWalletMobile"
        )
        .forEach(button => {

            button.textContent =

                account

                    ? shortAddress(account)

                    : "Connect Wallet";

            button.dataset.connected =

                account

                    ? "true"

                    : "false";

        });

    const walletStatus =
        document.getElementById(
            "walletStatus"
        );

    if (walletStatus) {

        walletStatus.textContent =

            account

                ? "Connected"

                : "Not Connected";

    }

    const walletAddress =
        document.getElementById(
            "walletAddress"
        );

    if (walletAddress) {

        walletAddress.textContent =

            account

                ? shortAddress(account)

                : "Not Connected";

    }

    const dashboardWallet =
        document.getElementById(
            "dashboardWallet"
        );

    const headerWalletStatus =
    document.getElementById(
        "headerWalletStatus"
    );

if (headerWalletStatus) {

    headerWalletStatus.textContent =

        account

            ? "🟢"

            : "🔴";

}

    if (dashboardWallet) {

        dashboardWallet.textContent =

            account

                ? shortAddress(account)

                : "-";

    }

}

// =====================================================
// NETWORK (MULTICHAIN)
// =====================================================

export async function getWalletChainId() {

    if (!hasWallet()) {

        return null;

    }

    const hex =
        await window.ethereum.request({

            method:
                "eth_chainId"

        });

    return parseInt(hex, 16);

}

/// Returns true if the wallet is currently connected to
/// ANY chain LaunchFuture supports (multichain-ready check),
/// not just the one selected in the UI.
export async function checkNetwork() {

    if (!hasWallet()) {

        return false;

    }

    const walletChainId =
        await getWalletChainId();

    return Boolean(
        getNetworkByChainId(walletChainId)
    );

}

/// Ask the wallet to switch to `chainId` (defaults to the
/// currently selected network). Adds the chain first if the
/// wallet doesn't know about it yet.
export async function switchNetwork(chainId) {

    if (!hasWallet()) {

        throw new Error(
            "Wallet not detected."
        );

    }

    const network =
        chainId
            ? getNetworkByChainId(chainId)
            : getCurrentNetwork();

    if (!network) {

        throw new Error(
            "Unsupported network."
        );

    }

    try {

        await window.ethereum.request({

            method:
                "wallet_switchEthereumChain",

            params: [

                {
                    chainId:
                        network.chainIdHex
                }

            ]

        });

    }

    catch (error) {

        if (error.code !== 4902) {

            throw error;

        }

        await window.ethereum.request({

            method:
                "wallet_addEthereumChain",

            params: [

                {

                    chainId:
                        network.chainIdHex,

                    chainName:
                        network.name,

                    nativeCurrency: {

                        name:
                            network.symbol,

                        symbol:
                            network.symbol,

                        decimals:
                            network.decimals

                    },

                    rpcUrls: [

                        network.rpcUrl

                    ],

                    blockExplorerUrls: [

                        network.explorer

                    ]

                }

            ]

        });

    }

    setCurrentNetwork(network.chainId);

}

// =====================================================
// NETWORK SELECTOR UI
// =====================================================

function renderNetworkOptions(select) {

    const ready = getReadyNetworks();

    const current = getCurrentNetwork();

    select.innerHTML = ready

        .map(network => `
            <option value="${network.chainId}"
                ${network.chainId === current.chainId ? "selected" : ""}>
                ${network.name}
            </option>
        `)

        .join("");

}

function injectNetworkSelector() {

    if (document.getElementById("networkSelect")) {

        return;

    }

    const anchor =
        document.querySelector(
            "#connectWallet"
        ) ||
        document.querySelector(
            "#headerWalletStatus"
        );

    if (!anchor || !anchor.parentElement) {

        return;

    }

    const select =
        document.createElement("select");

    select.id = "networkSelect";

    select.className = "network-select";

    select.title = "Switch network";

    renderNetworkOptions(select);

    anchor.parentElement.insertBefore(
        select,
        anchor
    );

    select.addEventListener(

        "change",

        async () => {

            const chainId =
                Number(select.value);

            try {

                if (hasWallet() && account) {

                    await switchNetwork(chainId);

                }

                else {

                    setCurrentNetwork(chainId);

                }

                window.location.reload();

            }

            catch (error) {

                console.error(error);

                alert(

                    error?.message ||

                    "Unable to switch network."

                );

                renderNetworkOptions(select);

            }

        }

    );

}

function bindNetworkSelector() {

    injectNetworkSelector();

    onNetworkChanged(() => {

        const select =
            document.getElementById(
                "networkSelect"
            );

        if (select) {

            renderNetworkOptions(select);

        }

    });

}

// =====================================================
// INTERNAL
// =====================================================

async function hydrateWallet(address) {

    provider =
        new BrowserProvider(
            window.ethereum
        );

    signer =
        await provider.getSigner();

    account =
        address;

    const network =
        await provider.getNetwork();

    chainId =
        Number(
            network.chainId
        );

    // Multichain sync: if the wallet is already sitting on a
    // supported chain, make that the active app network instead
    // of forcing a switch away from where the user already is.
    const supported =
        getNetworkByChainId(chainId);

    if (
        supported &&
        supported.chainId !== getCurrentNetwork().chainId
    ) {

        setCurrentNetwork(supported.chainId);

    }

    updateWalletUI();

    emitAccountChanged(
        account
    );

    emitChainChanged(
        chainId
    );

}

function clearWalletState() {

    provider = null;

    signer = null;

    account = null;

    chainId = null;

    localStorage.removeItem(
        STORAGE.wallet
    );

    updateWalletUI();

    emitAccountChanged(
        null
    );

    emitChainChanged(
        null
    );

}

// =====================================================
// CONNECT
// =====================================================

export async function connectWallet() {

    if (!hasWallet()) {

        throw new Error(
            "Wallet not detected."
        );

    }

    const accounts =
        await window.ethereum.request({

            method:
                "eth_requestAccounts"

        });

    if (!accounts.length) {

        throw new Error(
            "No account selected."
        );

    }

    if (!(await checkNetwork())) {

        await switchNetwork();

    }

    await hydrateWallet(
        accounts[0]
    );

    localStorage.setItem(

        STORAGE.wallet,

        "connected"

    );

    return account;

}

export async function restoreConnection() {

    if (!hasWallet()) {

        updateWalletUI();

        return null;

    }

    const remember =
        localStorage.getItem(
            STORAGE.wallet
        );

    if (remember !== "connected") {

        updateWalletUI();

        return null;

    }

    const accounts =
        await window.ethereum.request({

            method:
                "eth_accounts"

        });

    if (!accounts.length) {

        clearWalletState();

        return null;

    }

    await hydrateWallet(
        accounts[0]
    );

    return account;

}
// =====================================================
// EVENTS
// =====================================================

function bindWalletEvents() {

    if (!hasWallet()) {

        return;

    }

    window.ethereum.on(

        "accountsChanged",

        async accounts => {

            try {

                if (!accounts.length) {

                    clearWalletState();

                    return;

                }

                await hydrateWallet(
                    accounts[0]
                );

            }

            catch (error) {

                console.error(error);

            }

        }

    );

    window.ethereum.on(

        "chainChanged",

        async () => {

            try {

                const hex =
                    await window.ethereum.request({

                        method:
                            "eth_chainId"

                    });

                chainId =
                    parseInt(hex, 16);

                const supported =
                    getNetworkByChainId(chainId);

                if (supported) {

                    setCurrentNetwork(
                        supported.chainId
                    );

                }

                if (!account) {

                    return;

                }

                emitChainChanged(
                    chainId
                );

            }

            catch (error) {

                console.error(error);

            }

        }

    );

}

// =====================================================
// BUTTONS
// =====================================================

function bindConnectButtons() {

    const targets =
        document.querySelectorAll(
            "#connectWallet, #headerWalletStatus"
        );

    targets.forEach(button => {

            button.style.cursor =
                "pointer";

            button.onclick =
                async () => {

                    if (account) {

                        return;

                    }

                    try {

                        await connectWallet();

                    }

                    catch (error) {

                        console.error(error);

                        alert(

                            error?.message ||

                            "Unable to connect wallet."

                        );

                    }

                };

        });

}

// =====================================================
// INITIALIZE
// =====================================================

export async function initializeWallet() {

    if (initialized) {

        return;

    }

    initialized = true;

    bindWalletEvents();

    bindConnectButtons();

    bindNetworkSelector();

    updateWalletUI();

    /*
    MODE B

    - Tidak auto connect untuk user baru
    - Akan restore hanya jika user
      pernah connect sebelumnya
    */

    try {

        await restoreConnection();

    }

    catch (error) {

        console.error(error);

    }

}
