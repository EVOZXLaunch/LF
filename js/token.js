import {
    Contract,
    JsonRpcProvider,
    BrowserProvider,
    formatUnits,
    parseUnits
} from "https://esm.sh/ethers@6";

import {
    NETWORK,
    ABI,
    explorerAddress,
    isZeroAddress
} from "./config.js";

import {
    initializeWallet
} from "./wallet.js";

// =====================================================
// STATE
// =====================================================

let provider = null;

let tokenAbi = null;

let signer = null;

// =====================================================
// DOM
// =====================================================

const $ = selector =>
    document.querySelector(selector);

function setText(id, value) {

    const element =
        document.getElementById(id);

    if (!element) {

        return;

    }

    element.textContent = value;

}

function setHTML(id, value) {

    const element =
        document.getElementById(id);

    if (!element) {

        return;

    }

    element.innerHTML = value;

}

// =====================================================
// HELPERS
// =====================================================

function shortAddress(address) {

    if (!address) {

        return "-";

    }

    return (

        address.slice(0, 6) +

        "..." +

        address.slice(-4)

    );

}

let currentDecimals = 18;

function formatSupply(value) {

    try {

        return Number(

            formatUnits(

                value,

                currentDecimals

            )

        ).toLocaleString();

    }

    catch {

        return String(value);

    }

}

function formatStatus(value) {

    return value

        ? "Enabled"

        : "Disabled";

}

function setOwnerStatus(
    message,
    type = ""
) {

    const el =
        document.getElementById(
            "ownerStatus"
        );

    if (!el) {
        return;
    }

    el.className =
        "status-panel";

    if (type) {
        el.classList.add(type);
    }

    el.textContent =
        message;

}

// =====================================================
// ABI
// =====================================================

async function loadAbi() {

    if (tokenAbi) {

        return tokenAbi;

    }

    const response =

        await fetch(

            ABI.token

        );

    if (!response.ok) {

        throw new Error(

            "Unable to load token ABI."

        );

    }

    tokenAbi =

        await response.json();

    return tokenAbi;

}

// =====================================================
// PROVIDER
// =====================================================

function getProvider() {

    if (provider) {

        return provider;

    }

    provider =

        new JsonRpcProvider(

            NETWORK.rpcUrl

        );

    return provider;

}

// =====================================================
// CONTRACT
// =====================================================

async function getTokenContract(address) {

    const abi =

        await loadAbi();

    return new Contract(

        address,

        abi,

        getProvider()

    );

}

// =====================================================
// ADDRESS
// =====================================================

function getTokenAddress() {

    const params =

        new URLSearchParams(

            window.location.search

        );

    return params.get(

        "address"

    );

}

// =====================================================
// LOAD TOKEN DATA
// =====================================================

export async function loadTokenData() {

    const address =

        getTokenAddress();

    if (!address) {

        throw new Error(

            "Token address not provided."

        );

    }

    const token =

        await getTokenContract(

            address

        );

    const [
        name,
        symbol,
        owner,
        totalSupply,
        maxSupply,
        decimals,

        burnable,
        mintable,
        tradingEnabled,
        renounceEnabled,

        website,
        telegram,
        twitter,
        logoURI,

        security,
        taxes,
        analytics

    ] = await Promise.all([

        token.name(),
        token.symbol(),
        token.owner(),
        token.totalSupply(),
        token.MAX_SUPPLY(),
        token.decimals(),

        token.burnable(),
        token.mintable(),
        token.tradingEnabled(),
        token.renounceEnabled(),

        token.website(),
        token.telegram(),
        token.twitter(),
        token.logoURI(),

        token.getSecurityConfig(),
        token.getTaxConfig(),
        token.getAnalytics()

    ]);

    currentDecimals = Number(decimals);

    return {

        address,

        name,
        symbol,
        owner,
        totalSupply,
        maxSupply,
        decimals: currentDecimals,

        // Chain / version are not stored on-chain by this
        // contract generation — reflect the network the
        // page is currently reading from instead.
        deployedChainId: NETWORK.chainId,
        launchKitVersion: "LFT",

        burnable,
        mintable,
        mintUsed: totalSupply >= maxSupply,
        ownershipEnabled: !isZeroAddress(owner),
        renounceEnabled,

        website,
        telegram,
        twitter,
        logoURI,

        maxWalletEnabled: security.maxWalletEnabled,
        maxWalletPercent: Number(security.maxWalletPercent),

        maxTxEnabled: security.maxTxEnabled,
        maxTxPercent: Number(security.maxTxPercent),

        // Trading is always gated behind enableTrading() on
        // this contract generation, so the "control" toggle
        // is effectively always on.
        tradingControlEnabled: true,
        tradingEnabled,

        buyTaxEnabled: taxes.buyTaxEnabled,
        buyTax: Number(taxes.buyTax),

        sellTaxEnabled: taxes.sellTaxEnabled,
        sellTax: Number(taxes.sellTax),

        burnTaxShare: Number(taxes.burnShare),

        marketingWallet: taxes.marketingWallet,
        developmentWallet: taxes.developmentWallet,

        analytics: {

            holders: Number(analytics.holders),
            buys: Number(analytics.buys),
            sells: Number(analytics.sells),
            transfers: Number(analytics.transfers),
            burned: analytics.burned,
            taxed: analytics.taxed

        }

    };

}

// =====================================================
// OWNER TOOLS
// =====================================================

async function detectOwner(
    token
) {

    if (
        !window.ethereum
    ) {
        return false;
    }

    const accounts =
        await window.ethereum.request({
            method:
                "eth_accounts"
        });

    if (
        !accounts.length
    ) {
        return false;
    }

    return (

        accounts[0]
            .toLowerCase()

        ===

        token.owner
            .toLowerCase()

    );

}

async function renderOwnerTools(
    token
) {

    const section =
        document.getElementById(
            "ownerTools"
        );

    if (!section) {
        return;
    }

    const isOwner =
        await detectOwner(
            token
        );

    if (!isOwner) {

        section.classList.add(
            "hidden"
        );

        return;

    }

    section.classList.remove(
        "hidden"
    );

}

// =====================================================
// STATUS
// =====================================================

function setStatus(id, enabled) {

    const element =

        document.getElementById(id);

    if (!element) {

        return;

    }

    element.textContent =

        enabled

            ? "Enabled"

            : "Disabled";

    element.className =

        enabled

            ? "status enabled"

            : "status disabled";

}

// =====================================================
// BASIC
// =====================================================

function renderBasic(token) {

    setText(

        "tokenName",

        token.name

    );

    setText(

        "tokenSymbol",

        token.symbol

    );

    setText(

        "tokenAddress",

        token.address

    );

    setText(

        "ownerAddress",

        token.owner

    );

    setText(

        "owner",

        shortAddress(

            token.owner

        )

    );

    setText(

        "supply",

        formatSupply(

            token.totalSupply

        )

    );

    setText(

        "chainId",

        String(

            token.deployedChainId

        )

    );

    setText(

        "version",

        String(

            token.launchKitVersion

        )

    );

}

// =====================================================
// METADATA
// =====================================================

function renderMetadata(token) {

    setText(

        "website",

        token.website || "-"

    );

    setText(

        "telegram",

        token.telegram || "-"

    );

    setText(

        "twitter",

        token.twitter || "-"

    );

    const logo =

        document.getElementById(

            "logo"

        );

    if (

        logo &&

        token.logoURI

    ) {

        logo.src =

            token.logoURI;

    }

}

// =====================================================
// FEATURES
// =====================================================

function renderFeatures(token) {

    setStatus(

        "burnable",

        token.burnable

    );

    setStatus(

        "mintable",

        token.mintable

    );

    setStatus(

        "ownership",

        token.ownershipEnabled

    );

    setStatus(

        "mintUsed",

        token.mintUsed

    );

}

// =====================================================
// SECURITY
// =====================================================

function renderSecurity(token) {

    setText(

        "maxWalletEnabled",

        formatStatus(

            token.maxWalletEnabled

        )

    );

    setText(

        "maxWalletPercent",

        token.maxWalletEnabled

            ? `${token.maxWalletPercent}%`

            : "-"

    );

    setText(

        "maxTxEnabled",

        formatStatus(

            token.maxTxEnabled

        )

    );

    setText(

        "maxTxPercent",

        token.maxTxEnabled

            ? `${token.maxTxPercent}%`

            : "-"

    );

}

// =====================================================
// TRADING & TAX
// =====================================================

function renderTrading(token) {

    setText(

        "tradingControlEnabled",

        formatStatus(

            token.tradingControlEnabled

        )

    );

    setText(

        "tradingEnabled",

        formatStatus(

            token.tradingEnabled

        )

    );

    setText(

        "buyTaxEnabled",

        formatStatus(

            token.buyTaxEnabled

        )

    );

    setText(

        "buyTax",

        token.buyTaxEnabled

            ? `${token.buyTax}%`

            : "-"

    );

    setText(

        "sellTaxEnabled",

        formatStatus(

            token.sellTaxEnabled

        )

    );

    setText(

        "sellTax",

        token.sellTaxEnabled

            ? `${token.sellTax}%`

            : "-"

    );

    setText(

        "burnTaxShare",

        Number(

            token.burnTaxShare

        ) > 0

            ? `${token.burnTaxShare}%`

            : "-"

    );

}

// =====================================================
// DISTRIBUTION
// =====================================================

function renderDistribution(token) {

    setText(

        "marketingWallet",

        isZeroAddress(

            token.marketingWallet

        )

            ? "-"

            : token.marketingWallet

    );

    setText(

        "developmentWallet",

        isZeroAddress(

            token.developmentWallet

        )

            ? "-"

            : token.developmentWallet

    );

}

// =====================================================
// DEX
// =====================================================

function renderDex(token) {

    setText(

        "pairInitialized",

        token.analytics.holders > 0

            ? `${token.analytics.holders.toLocaleString()} holders`

            : "No activity yet"

    );

    setText(

        "dexPair",

        `Buys: ${token.analytics.buys} · Sells: ${token.analytics.sells} · ` +
        `Burned: ${formatSupply(token.analytics.burned)} ${token.symbol}`

    );

}

// =====================================================
// ACTIONS
// =====================================================

function bindActions(token) {

    const copyButton =

        document.getElementById(

            "copyAddress"

        );

    if (copyButton) {

        copyButton.onclick =

            async () => {

                try {

                    await navigator

                        .clipboard

                        .writeText(

                            token.address

                        );

                    copyButton.textContent =

                        "Copied";

                    setTimeout(

                        () => {

                            copyButton.textContent =

                                "Copy Address";

                        },

                        1500

                    );

                }

                catch (error) {

                    console.error(

                        error

                    );

                }

            };

    }

    const explorerButton =

        document.getElementById(

            "openExplorer"

        );

    if (explorerButton) {

        explorerButton.onclick =

            () => {

                window.open(

                    explorerAddress(

                        token.address

                    ),

                    "_blank"

                );

            };

    }

}

// =====================================================
// MAIN RENDER
// =====================================================

export async function renderToken() {

    try {

        const token =

            await loadTokenData();

        renderBasic(

            token

        );

        renderMetadata(

            token

        );

        renderFeatures(

            token

        );

        renderSecurity(

            token

        );

        renderTrading(

            token

        );

        renderDistribution(

            token

        );

        renderDex(

            token

        );

        bindActions(

    token

);

await renderOwnerTools(

    token

);
        
    }

    catch (error) {

        console.error(

            error

        );

        const container =

            document.getElementById(

                "tokenContainer"

            );

        if (!container) {

            return;

        }

        container.innerHTML = `

<div class="empty-state">

    <h2>

        Unable To Load Token

    </h2>

    <p>

        This token address is invalid or the contract is not a supported LaunchFuture EVOZ20 token.

    </p>

</div>

`;

    }

}

// =====================================================
// INITIALIZE
// =====================================================

async function initialize() {

    await initializeWallet();

    await renderToken();

}

document.addEventListener(

    "DOMContentLoaded",

    initialize

);

// =====================================================
// OWNER ACTIONS
// =====================================================

async function mintToken() {

    try {

        const recipient =
            document
                .getElementById(
                    "mintRecipient"
                )
                .value
                .trim();

        const amount =
            document
                .getElementById(
                    "mintAmount"
                )
                .value
                .trim();

        if (!recipient) {

            setOwnerStatus(
                "Recipient required",
                "error"
            );

            return;
        }

        if (!amount || Number(amount) <= 0) {

            setOwnerStatus(
                "Invalid amount",
                "error"
            );

            return;
        }

        if (!window.ethereum) {

            setOwnerStatus(
                "Wallet not found",
                "error"
            );

            return;
        }

        const accounts =
            await window.ethereum.request({
                method:
                    "eth_requestAccounts"
            });

        const signerProvider =
            new BrowserProvider(
                window.ethereum
            );

        const signer =
            await signerProvider.getSigner();

        const abi =
            await loadAbi();

        const contract =
            new Contract(
                getTokenAddress(),
                abi,
                signer
            );

        setOwnerStatus(
            "Waiting wallet confirmation..."
        );

        const tx =
            await contract.mint(
                recipient,
                parseUnits(amount, currentDecimals)
            );

        setOwnerStatus(
            "Transaction submitted..."
        );

        await tx.wait();

        setOwnerStatus(
            "Mint success",
            "success"
        );

        await renderToken();

    }

    catch (error) {

        console.error(error);

        setOwnerStatus(
            error.reason ||
            error.message ||
            "Mint failed",
            "error"
        );

    }

}

async function enableTradingAction() {

    try {

        if (!window.ethereum) {

            setOwnerStatus(
                "Wallet not found",
                "error"
            );

            return;

        }

        const signerProvider =
            new BrowserProvider(
                window.ethereum
            );

        const signer =
            await signerProvider.getSigner();

        const abi =
            await loadAbi();

        const contract =
            new Contract(
                getTokenAddress(),
                abi,
                signer
            );

        setOwnerStatus(
            "Waiting wallet confirmation..."
        );

        const tx =
            await contract.enableTrading();

        setOwnerStatus(
            "Transaction submitted..."
        );

        await tx.wait();

        await renderToken();

        setOwnerStatus(
            "Trading enabled",
            "success"
        );

    }

    catch (error) {

        console.error(error);

        setOwnerStatus(
            error.reason ||
            error.message ||
            "Enable trading failed",
            "error"
        );

    }

}

async function disableTradingAction() {

    alert(
        "Disable Trading clicked"
    );

}

document
    .getElementById(
        "mintButton"
    )
    ?.addEventListener(
        "click",
        mintToken
    );

document
    .getElementById(
        "enableTradingButton"
    )
    ?.addEventListener(
        "click",
        enableTradingAction
    );

document
    .getElementById(
        "disableTradingButton"
    )
    ?.addEventListener(
        "click",
        disableTradingAction
    );

// =====================================================
// EXPORTS
// =====================================================

export {

    initialize

};
