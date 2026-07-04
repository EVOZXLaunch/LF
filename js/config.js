// =====================================================
// LAUNCHFUTURE — MULTICHAIN CONFIG
// =====================================================
//
// Every chain LaunchFuture is deployed to is described here.
// Adding a new chain = adding one entry to NETWORKS below,
// nothing else in the app needs to change.
//
// IMPORTANT
// ---------
// Contract addresses below MUST be replaced with the real
// deployed addresses for each chain. Any network left with
// zero addresses is treated as "not yet deployed" and will
// be hidden from the network switcher automatically so the
// app never tries to send a transaction to address(0).
// =====================================================

export const ZERO_ADDRESS =
    "0x0000000000000000000000000000000000000000";

// =====================================================
// NETWORKS
// =====================================================

export const NETWORKS = [

    {
        chainId: 805,
        chainIdHex: "0x325",
        name: "EVOZ Mainnet",
        symbol: "EVOZ",
        decimals: 18,
        rpcUrl: "https://rpc.evozscan.com",
        explorer: "https://evozscan.com",

        contracts: {
            factory: "0xcd86Ca358283f06581365635372E5bF0D30271D3",
            exchange: "0x9680B43F695d5245062e59CCA92ad92DE5aed56e",
            treasury: "0x50Cd30Ff7f0fbBD9d0FDe1F60DE8c52D6F390c5C",
            deployer: 0x3f81E785628D452A8Aae1536D15A3586B490F0c5,
            // ERC20 token accepted as an alternate payment method
            // (LFT / EVOZX utility token) on this chain.
            utilityToken: "0x62B9559F193d111aF92d9a5604d79024BFB1C847",
            utilitySymbol: "LFT"
        },

        // Payment method symbols to probe on-chain via
        // getPaymentMethod(symbol) — "NATIVE" is always tried.
        paymentSymbols: ["NATIVE", "LFT"]
    },

    // ---------------------------------------------------
    // Placeholder chains — fill in real addresses after
    // deploying the LaunchFuture contracts on each network.
    // These stay hidden from the switcher until a factory
    // address is set (see isNetworkReady below).
    // ---------------------------------------------------

    {
        chainId: 1,
        chainIdHex: "0x1",
        name: "Ethereum Mainnet",
        symbol: "ETH",
        decimals: 18,
        rpcUrl: "https://eth.llamarpc.com",
        explorer: "https://etherscan.io",
        contracts: {
            factory: ZERO_ADDRESS,
            exchange: ZERO_ADDRESS,
            treasury: ZERO_ADDRESS,
            deployer: ZERO_ADDRESS,
            utilityToken: ZERO_ADDRESS,
            utilitySymbol: "LFT"
        },
        paymentSymbols: ["NATIVE", "LFT"]
    },

    {
        chainId: 56,
        chainIdHex: "0x38",
        name: "BNB Smart Chain",
        symbol: "BNB",
        decimals: 18,
        rpcUrl: "https://bsc-dataseed.binance.org",
        explorer: "https://bscscan.com",
        contracts: {
            factory: ZERO_ADDRESS,
            exchange: ZERO_ADDRESS,
            treasury: ZERO_ADDRESS,
            deployer: ZERO_ADDRESS,
            utilityToken: ZERO_ADDRESS,
            utilitySymbol: "LFT"
        },
        paymentSymbols: ["NATIVE", "LFT"]
    },

    {
        chainId: 137,
        chainIdHex: "0x89",
        name: "Polygon",
        symbol: "POL",
        decimals: 18,
        rpcUrl: "https://polygon-rpc.com",
        explorer: "https://polygonscan.com",
        contracts: {
            factory: ZERO_ADDRESS,
            exchange: ZERO_ADDRESS,
            treasury: ZERO_ADDRESS,
            deployer: ZERO_ADDRESS,
            utilityToken: ZERO_ADDRESS,
            utilitySymbol: "LFT"
        },
        paymentSymbols: ["NATIVE", "LFT"]
    },

    {
        chainId: 11155111,
        chainIdHex: "0xaa36a7",
        name: "Sepolia Testnet",
        symbol: "ETH",
        decimals: 18,
        rpcUrl: "https://rpc.sepolia.org",
        explorer: "https://sepolia.etherscan.io",
        contracts: {
            factory: ZERO_ADDRESS,
            exchange: ZERO_ADDRESS,
            treasury: ZERO_ADDRESS,
            deployer: ZERO_ADDRESS,
            utilityToken: ZERO_ADDRESS,
            utilitySymbol: "LFT"
        },
        paymentSymbols: ["NATIVE", "LFT"]
    }

];

export function isNetworkReady(network) {

    return Boolean(
        network &&
        network.contracts &&
        network.contracts.factory &&
        network.contracts.factory !== ZERO_ADDRESS
    );

}

export function getReadyNetworks() {

    return NETWORKS.filter(isNetworkReady);

}

export function getNetworkByChainId(chainId) {

    const id = Number(chainId);

    return NETWORKS.find(
        network => network.chainId === id
    ) || null;

}

// =====================================================
// CURRENT NETWORK (selected chain)
// =====================================================

const CURRENT_NETWORK_STORAGE_KEY =
    "launchfuture_network";

function readStoredChainId() {

    try {

        const raw = localStorage.getItem(
            CURRENT_NETWORK_STORAGE_KEY
        );

        return raw ? Number(raw) : null;

    }

    catch {

        return null;

    }

}

function defaultNetwork() {

    const ready = getReadyNetworks();

    return ready[0] || NETWORKS[0];

}

let currentNetwork = (() => {

    const storedId = readStoredChainId();

    const stored =
        storedId !== null
            ? getNetworkByChainId(storedId)
            : null;

    return (stored && isNetworkReady(stored))
        ? stored
        : defaultNetwork();

})();

const networkChangeListeners = [];

export function onNetworkChanged(callback) {

    if (typeof callback === "function") {

        networkChangeListeners.push(callback);

    }

}

export function getCurrentNetwork() {

    return currentNetwork;

}

export function setCurrentNetwork(chainId) {

    const network =
        getNetworkByChainId(chainId);

    if (!network) {

        throw new Error(
            "Unsupported network."
        );

    }

    currentNetwork = network;

    try {

        localStorage.setItem(

            CURRENT_NETWORK_STORAGE_KEY,

            String(network.chainId)

        );

    }

    catch {

        // localStorage unavailable — ignore, in-memory state still updates.

    }

    for (const callback of networkChangeListeners) {

        try {

            callback(network);

        }

        catch (error) {

            console.error(error);

        }

    }

    return network;

}

// =====================================================
// BACKWARD-COMPATIBLE ACCESSORS
// =====================================================
//
// Older modules import NETWORK / CONTRACTS as plain objects.
// These proxies always reflect whichever network is currently
// selected, so existing call sites keep working untouched.

export const NETWORK = new Proxy({}, {
    get(_target, prop) {
        return getCurrentNetwork()[prop];
    }
});

export const CONTRACTS = new Proxy({}, {
    get(_target, prop) {
        const network = getCurrentNetwork();
        if (prop === "explorer") {
            return network.explorer;
        }
        if (prop === "evozx") {
            return network.contracts.utilityToken;
        }
        return network.contracts[prop];
    }
});

// =====================================================
// STORAGE KEYS
// =====================================================

export const STORAGE = {

    wallet: "launchfuture_wallet",
    theme: "launchfuture_theme",
    lastToken: "launchfuture_last_token",
    deployHistory: "launchfuture_deploy_history",
    network: CURRENT_NETWORK_STORAGE_KEY

};

// =====================================================
// ABI PATHS
// =====================================================

export const ABI = {

    factory: "./abi/factory.json",
    exchange: "./abi/exchange.json",
    evozx: "./abi/evozx.json",
    token: "./abi/token.json",
    erc20: "./abi/erc20.json",
    deployer: "./abi/deployer.json"

};

export const DOWNLOADS = {

    standardInput: "./docs/standard-input.json"

};

export const ASSETS = {

    logo: "./images/logo.png"

};

// Legacy static exchange rate constant. Kept only so old
// screens that import EXCHANGE.evozPerEVOZX don't crash;
// prefer reading the live rate from exchange.js instead.
export const EXCHANGE = {

    evozPerLFT: 0.2

};

export const UI = {

    addressPrefix: 6,
    addressSuffix: 4,
    animation: 250

};

// =====================================================
// EXPLORER HELPERS (use the *current* network's explorer)
// =====================================================

export function explorerAddress(address) {

    return `${getCurrentNetwork().explorer}/address/${address}`;

}

export function explorerToken(address) {

    return `${getCurrentNetwork().explorer}/token/${address}`;

}

export function explorerTransaction(hash) {

    return `${getCurrentNetwork().explorer}/tx/${hash}`;

}

export function isZeroAddress(address) {

    return (
        !address ||
        address.toLowerCase() === ZERO_ADDRESS
    );

}
