import {
    Contract,
    JsonRpcProvider,
    Interface,
    ZeroAddress
} from "https://esm.sh/ethers@6";

import {
    CONTRACTS,
    NETWORK,
    ABI,
    getCurrentNetwork,
    onNetworkChanged
} from "./config.js";

import {
    getSigner
} from "./wallet.js";

// =====================================================
// STATE
// (cached per network so switching chains never reuses
//  a contract instance pointed at the wrong address)
// =====================================================

let factoryAbi = null;

let factoryInterface = null;

let cachedChainId = null;

let readProvider = null;

let factoryReadContract = null;

let utilityReadContract = null;

onNetworkChanged(() => {

    // Force every cached contract/provider to be rebuilt
    // against the newly selected network on next use. ABIs
    // are also cleared since they are now resolved per
    // network (./abi/<network.key>/...).
    cachedChainId = null;

    readProvider = null;

    factoryReadContract = null;

    utilityReadContract = null;

    factoryAbi = null;

    factoryInterface = null;

    erc20Abi = null;

});

function resetCacheIfNetworkChanged() {

    const chainId =
        getCurrentNetwork().chainId;

    if (chainId !== cachedChainId) {

        cachedChainId = chainId;

        readProvider = null;

        factoryReadContract = null;

        utilityReadContract = null;

    }

}

// =====================================================
// ABI
// =====================================================

async function loadAbi(path) {

    const response =
        await fetch(path);

    if (!response.ok) {

        throw new Error(
            `Unable to load ABI: ${path}`
        );

    }

    return await response.json();

}

export async function loadFactoryAbi() {

    if (factoryAbi) {

        return factoryAbi;

    }

    factoryAbi =
        await loadAbi(
            ABI.factory
        );

    factoryInterface =
        new Interface(
            factoryAbi
        );

    return factoryAbi;

}

let erc20Abi = null;

export async function loadERC20Abi() {

    if (erc20Abi) {

        return erc20Abi;

    }

    erc20Abi =
        await loadAbi(
            ABI.erc20
        );

    return erc20Abi;

}

// Legacy alias — older modules import loadLFTAbi().
export const loadLFTAbi = loadERC20Abi;

// =====================================================
// PROVIDER
// =====================================================

export function getReadProvider() {

    resetCacheIfNetworkChanged();

    if (readProvider) {

        return readProvider;

    }

    readProvider =
        new JsonRpcProvider(
            NETWORK.rpcUrl
        );

    return readProvider;

}

// =====================================================
// CONTRACTS
// =====================================================

export async function getFactoryRead() {

    resetCacheIfNetworkChanged();

    if (factoryReadContract) {

        return factoryReadContract;

    }

    factoryReadContract =
        new Contract(

            CONTRACTS.factory,

            await loadFactoryAbi(),

            getReadProvider()

        );

    return factoryReadContract;

}

export async function getFactoryWrite() {

    const signer =
        getSigner();

    if (!signer) {

        throw new Error(
            "Wallet not connected."
        );

    }

    return new Contract(

        CONTRACTS.factory,

        await loadFactoryAbi(),

        signer

    );

}

export const getFactoryForWrite =
    getFactoryWrite;

/// Read-only contract for the network's utility/payment ERC20
/// token (e.g. LFT). Works for any standard ERC20.
export async function getUtilityRead() {

    resetCacheIfNetworkChanged();

    if (!CONTRACTS.lft || CONTRACTS.lft === ZeroAddress) {

        return null;

    }

    if (utilityReadContract) {

        return utilityReadContract;

    }

    utilityReadContract =
        new Contract(

            CONTRACTS.lft,

            await loadERC20Abi(),

            getReadProvider()

        );

    return utilityReadContract;

}

export async function getUtilityWrite() {

    const signer =
        getSigner();

    if (!signer) {

        throw new Error(
            "Wallet not connected."
        );

    }

    if (!CONTRACTS.lft || CONTRACTS.lft === ZeroAddress) {

        throw new Error(
            "No utility token configured for this network."
        );

    }

    return new Contract(

        CONTRACTS.lft,

        await loadERC20Abi(),

        signer

    );

}

// Legacy aliases
export const getLFTRead = getUtilityRead;
export const getLFTWrite = getUtilityWrite;

// =====================================================
// EVENT PARSER
// =====================================================

export async function parseTokenDeployed(receipt) {

    await loadFactoryAbi();

    for (const log of receipt.logs) {

        try {

            const parsed =
                factoryInterface.parseLog(
                    log
                );

            if (
                parsed?.name ===
                "TokenDeployed"
            ) {

                return {

                    token:
                        parsed.args.token,

                    creator:
                        parsed.args.creator,

                    name:
                        parsed.args.name,

                    symbol:
                        parsed.args.symbol,

                    initialSupply:
                        parsed.args.initialSupply,

                    createdAt:
                        parsed.args.createdAt,

                    create2:
                        parsed.args.create2

                };

            }

        }

        catch {

            continue;

        }

    }

    return null;

}

// Legacy alias (old event name was TokenCreated).
export const parseTokenCreated = parseTokenDeployed;

// =====================================================
// FACTORY INFO
// =====================================================

// The new LFTFactory contract has no on-chain name/version
// getters, so these are simple constant labels for the UI.
export async function getFactoryName() {

    return "LaunchFuture Factory";

}

export async function getVersion() {

    return "LFTFactory";

}

export async function getLaunchKitVersion() {

    return 1;

}

export async function getOwner() {

    return (
        await getFactoryRead()
    ).owner();

}

export async function getTreasury() {

    return (
        await getFactoryRead()
    ).treasury();

}

export async function isPaused() {

    return (
        await getFactoryRead()
    ).paused();

}

export async function getBurnPercent() {

    return (
        await getFactoryRead()
    ).burnPercent();

}

export async function getTreasuryPercent() {

    return (
        await getFactoryRead()
    ).treasuryPercent();

}

// =====================================================
// TOKEN REGISTRY
// =====================================================

export async function getTotalTokens() {

    return Number(

        await (

            await getFactoryRead()

        ).totalDeployed()

    );

}

export async function getStatistics() {

    return (

        await getFactoryRead()

    ).getStatistics();

}

export async function getDeployedTokens(
    offset = 0,
    limit = 50
) {

    return (

        await getFactoryRead()

    ).getDeployedTokens(

        offset,

        limit

    );

}

/// Legacy-shaped list: fetches ALL deployed tokens and maps
/// each TokenInfo tuple to the old array shape
/// [address, creator, name, symbol, initialSupply, createdAt]
/// so existing explorer/index rendering code keeps working.
export async function getAllTokens() {

    const total =
        await getTotalTokens();

    if (total === 0) {

        return [];

    }

    const tokens =
        await getDeployedTokens(
            0,
            total
        );

    return tokens.map(info => ([

        info.token,

        info.creator,

        info.name,

        info.symbol,

        info.initialSupply,

        info.createdAt

    ]));

}

export async function getDeployedToken(index) {

    return (

        await getFactoryRead()

    ).getDeployedToken(

        index

    );
}

// Legacy alias
export const getToken = getDeployedToken;

export async function getCreatorTokens(
    creator
) {

    if (!creator) {

        return [];

    }

    return (

        await getFactoryRead()

    ).getCreatorTokens(

        creator

    );

}

// Legacy alias
export const getTokensByCreator = getCreatorTokens;

export async function isTokenFromFactory(
    address
) {

    if (!address) {

        return false;

    }

    return (

        await getFactoryRead()

    ).isTokenFromFactory(

        address

    );

}

// Legacy alias
export const isFactoryToken = isTokenFromFactory;

// =====================================================
// SYMBOL
// =====================================================

export async function isSymbolAvailable(
    symbol
) {

    if (!symbol) {

        return false;

    }

    return (

        await getFactoryRead()

    ).isSymbolAvailable(

        symbol.trim().toUpperCase()

    );

}

/// Legacy name, legacy polarity (true = already taken).
export async function symbolExists(
    symbol
) {

    if (!symbol) {

        return false;

    }

    const available =
        await isSymbolAvailable(symbol);

    return !available;

}

// =====================================================
// PAYMENT METHODS
// =====================================================

export async function getPaymentMethod(symbol) {

    return (

        await getFactoryRead()

    ).getPaymentMethod(

        symbol

    );

}

export async function getDeployFee(symbol) {

    const [deployFee, burnAmount, treasuryAmount] =

        await (

            await getFactoryRead()

        ).getDeployFee(

            symbol

        );

    return { deployFee, burnAmount, treasuryAmount };

}

export async function quoteNativeFee(symbol) {

    const [
        nativeFee,
        utilityAmount,
        burnAmount,
        treasuryAmount
    ] = await (

        await getFactoryRead()

    ).quoteNativeFee(

        symbol

    );

    return { nativeFee, utilityAmount, burnAmount, treasuryAmount };

}

/// Probes NETWORK.paymentSymbols in order and returns the
/// first one that is actually enabled on-chain right now.
/// This is what keeps deployment from reverting due to a
/// disabled/misconfigured payment method: we never blindly
/// assume a symbol works, we check the live contract state.
export async function findAvailablePaymentMethod() {

    const symbols =
        NETWORK.paymentSymbols || ["NATIVE"];

    for (const symbol of symbols) {

        try {

            const method =
                await getPaymentMethod(symbol);

            if (method.enabled) {

                return {

                    symbol,

                    isNative:
                        method.isNative,

                    burnEnabled:
                        method.burnEnabled,

                    token:
                        method.token,

                    exchange:
                        method.exchange,

                    deployFee:
                        method.deployFee

                };

            }

        }

        catch (error) {

            console.warn(
                `Payment method "${symbol}" not available:`,
                error?.shortMessage || error?.message
            );

        }

    }

    return null;

}

// =====================================================
// UTILITY / PAYMENT TOKEN BALANCE + ALLOWANCE
// =====================================================

export async function getUtilityBalance(address) {

    if (!address) {

        return 0n;

    }

    const token =
        await getUtilityRead();

    if (!token) {

        return 0n;

    }

    return token.balanceOf(address);

}

export async function getUtilityAllowance(owner) {

    if (!owner) {

        return 0n;

    }

    const token =
        await getUtilityRead();

    if (!token) {

        return 0n;

    }

    return token.allowance(

        owner,

        CONTRACTS.factory

    );

}

export async function approveUtility(amount) {

    if (!amount || amount <= 0n) {

        throw new Error(
            "Invalid approval amount."
        );

    }

    const token =
        await getUtilityWrite();

    const tx =
        await token.approve(

            CONTRACTS.factory,

            amount

        );

    await tx.wait();

    return tx;

}

// Legacy aliases used by dashboard.js / launch.js / exchange.js
export const getLFTBalance = getUtilityBalance;
export const getLFTAllowance = getUtilityAllowance;
export const approveLFT = approveUtility;

// =====================================================
// PREDICT ADDRESS
// =====================================================

export async function predictTokenAddress(
    config,
    metadata,
    salt
) {

    return (

        await getFactoryRead()

    ).predictTokenAddress(

        config,

        metadata,

        salt

    );

}

// =====================================================
// DEPLOY — NATIVE
// =====================================================

export async function deployWithNative(
    config,
    metadata,
    nativeFee
) {

    const factory =
        await getFactoryWrite();

    const tx =
        await factory.deployWithNative(

            config,

            metadata,

            { value: nativeFee }

        );

    const receipt =
        await tx.wait();

    const event =
        await parseTokenDeployed(receipt);

    if (!event) {

        throw new Error(
            "TokenDeployed event not found."
        );

    }

    return {

        hash: tx.hash,

        blockNumber: receipt.blockNumber,

        ...event

    };

}

// =====================================================
// DEPLOY — TOKEN PAYMENT (approve + CREATE2)
// =====================================================
//
// The contract's only non-native deploy paths are
// deployWithPermit (needs an EIP-2612 signature) and
// deployCreate2 (needs a prior ERC20 approve()). We use
// deployCreate2 with a random salt for reliability: a
// plain approve() is far less likely to revert than a
// permit signature with a mismatched domain/version.
// =====================================================

function randomSalt() {

    const bytes =
        crypto.getRandomValues(
            new Uint8Array(32)
        );

    return (
        "0x" +
        Array.from(bytes)
            .map(b => b.toString(16).padStart(2, "0"))
            .join("")
    );

}

export async function deployWithToken(
    config,
    metadata,
    paymentSymbol
) {

    const salt =
        randomSalt();

    const factory =
        await getFactoryWrite();

    const tx =
        await factory.deployCreate2(

            config,

            metadata,

            paymentSymbol,

            salt

        );

    const receipt =
        await tx.wait();

    const event =
        await parseTokenDeployed(receipt);

    if (!event) {

        throw new Error(
            "TokenDeployed event not found."
        );

    }

    return {

        hash: tx.hash,

        blockNumber: receipt.blockNumber,

        ...event

    };

}

// =====================================================
// HELPERS
// =====================================================

export function toBigInt(value) {

    try {

        return BigInt(value);

    }

    catch {

        return 0n;

    }

}

export function isZeroAddress(address) {

    return (

        !address ||

        address === ZeroAddress

    );

}

// =====================================================
// FACTORY SUMMARY
// =====================================================

export async function getFactoryInfo() {

    const [
        owner,
        treasury,
        paused,
        burnPercent,
        treasuryPercent,
        stats
    ] = await Promise.all([

        getOwner(),
        getTreasury(),
        isPaused(),
        getBurnPercent(),
        getTreasuryPercent(),
        getStatistics()

    ]);

    return {

        name: "LaunchFuture Factory",

        version: "LFTFactory",

        launchKitVersion: 1,

        owner,

        treasury,

        paused,

        burnPercent,

        treasuryPercent,

        totalTokens: Number(stats.totalTokens),

        totalCreators: Number(stats.totalCreators)

    };

}
