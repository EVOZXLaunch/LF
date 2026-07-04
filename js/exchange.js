import {
    Contract,
    JsonRpcProvider,
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
    getSigner,
    getAccount
} from "./wallet.js";

import {
    getUtilityBalance
} from "./factory.js";

let exchangeAbi = null;

let cachedChainId = null;

let provider = null;

let exchangeReadContract = null;

onNetworkChanged(() => {

    cachedChainId = null;

    provider = null;

    exchangeReadContract = null;

});

function resetCacheIfNetworkChanged() {

    const chainId =
        getCurrentNetwork().chainId;

    if (chainId !== cachedChainId) {

        cachedChainId = chainId;

        provider = null;

        exchangeReadContract = null;

    }

}

// =====================================================
// ABI
// =====================================================

async function loadAbi(path) {

    const response = await fetch(path);

    if (!response.ok) {

        throw new Error(
            `Unable to load ABI: ${path}`
        );

    }

    return await response.json();

}

export async function loadExchangeAbi() {

    if (exchangeAbi) {

        return exchangeAbi;

    }

    exchangeAbi = await loadAbi(
        ABI.exchange
    );

    return exchangeAbi;

}

// =====================================================
// PROVIDER / CONTRACT
// =====================================================

export function getReadProvider() {

    resetCacheIfNetworkChanged();

    if (provider) {

        return provider;

    }

    provider = new JsonRpcProvider(
        NETWORK.rpcUrl
    );

    return provider;

}

export async function getExchangeRead() {

    resetCacheIfNetworkChanged();

    if (!CONTRACTS.exchange || CONTRACTS.exchange === ZeroAddress) {

        return null;

    }

    if (exchangeReadContract) {

        return exchangeReadContract;

    }

    const abi = await loadExchangeAbi();

    exchangeReadContract = new Contract(

        CONTRACTS.exchange,

        abi,

        getReadProvider()

    );

    return exchangeReadContract;

}

export async function getExchangeWrite() {

    const signer = getSigner();

    if (!signer) {

        throw new Error(
            "Wallet not connected."
        );

    }

    if (!CONTRACTS.exchange || CONTRACTS.exchange === ZeroAddress) {

        throw new Error(
            "No exchange configured for this network."
        );

    }

    const abi = await loadExchangeAbi();

    return new Contract(

        CONTRACTS.exchange,

        abi,

        signer

    );

}

// =====================================================
// INFO
// =====================================================

export async function getLftPerNative() {

    const exchange = await getExchangeRead();

    if (!exchange) {

        return 0n;

    }

    return exchange.lftPerNative();

}

// Legacy alias — old code called this "rate".
export const getRate = getLftPerNative;

export async function getAvailableLiquidity() {

    const exchange = await getExchangeRead();

    if (!exchange) {

        return 0n;

    }

    return exchange.availableLiquidity();

}

// Legacy alias
export const getStock = getAvailableLiquidity;

export async function getExchangeOwner() {

    const exchange = await getExchangeRead();

    if (!exchange) {

        return ZeroAddress;

    }

    return exchange.owner();

}

export async function getExchangeTreasury() {

    const exchange = await getExchangeRead();

    if (!exchange) {

        return ZeroAddress;

    }

    return exchange.treasury();

}

export async function getExchangeStatus() {

    const exchange = await getExchangeRead();

    if (!exchange) {

        return {
            available: false,
            rate: 0n,
            liquidity: 0n,
            owner: ZeroAddress,
            treasury: ZeroAddress
        };

    }

    const [
        rate,
        liquidity,
        owner,
        treasury
    ] = await Promise.all([

        getLftPerNative(),
        getAvailableLiquidity(),
        getExchangeOwner(),
        getExchangeTreasury()

    ]);

    return {
        available: true,
        rate,
        liquidity,
        owner,
        treasury
    };

}

// =====================================================
// QUOTE
// =====================================================

/// LFT (utility token) amount received for a given native
/// coin amount, matching the on-chain formula exactly:
/// lftAmount = nativeAmount * lftPerNative / 1 ether
export async function quoteLFT(nativeAmount) {

    const exchange = await getExchangeRead();

    if (!exchange) {

        return 0n;

    }

    return exchange.quoteLFT(nativeAmount);

}

/// Inverse of quoteLFT: how much native coin is needed to
/// receive at least `targetUtilityAmount` of the utility
/// token. Rounds up so the purchase never comes up short.
export async function nativeNeededFor(targetUtilityAmount) {

    if (!targetUtilityAmount || targetUtilityAmount <= 0n) {

        return 0n;

    }

    const rate = await getLftPerNative();

    if (rate <= 0n) {

        throw new Error(
            "Exchange rate not available."
        );

    }

    const oneEther = 1_000_000_000_000_000_000n;

    // ceil division to guarantee enough native is sent
    return (
        (targetUtilityAmount * oneEther + rate - 1n) / rate
    );

}

export async function hasEnoughLiquidity(amount) {

    const exchange = await getExchangeRead();

    if (!exchange) {

        return false;

    }

    return exchange.hasLiquidity(amount);

}

// Legacy alias
export const hasEnoughStock = hasEnoughLiquidity;

// =====================================================
// PURCHASE (top up the utility/payment token with native coin)
// =====================================================

export async function purchaseWithNative(
    recipient,
    nativeAmount
) {

    if (!nativeAmount || nativeAmount <= 0n) {

        return null;

    }

    const exchange =
        await getExchangeWrite();

    const tx =
        await exchange.purchaseWithNative(

            recipient,

            { value: nativeAmount }

        );

    await tx.wait();

    return tx;

}

// Legacy alias — old UI called this "buyEVOZX".
export async function buyEVOZX(requiredNative) {

    const account = getAccount();

    return purchaseWithNative(
        account,
        requiredNative
    );

}

// =====================================================
// AUTO TOP-UP
// =====================================================
//
// Used before an ERC20-payment deployment: if the wallet
// doesn't hold enough of the utility token, buy exactly
// enough from the exchange with native coin first.
// =====================================================

export async function autoTopupUtility(requiredAmount) {

    const account =
        getAccount();

    const currentBalance =
        await getUtilityBalance(account);

    if (currentBalance >= requiredAmount) {

        return { purchased: false, amount: 0n };

    }

    const exchange =
        await getExchangeRead();

    if (!exchange) {

        throw new Error(
            "No exchange available to auto top-up on this network."
        );

    }

    const missing =
        requiredAmount - currentBalance;

    const requiredNative =
        await nativeNeededFor(missing);

    const canBuy =
        await hasEnoughLiquidity(missing);

    if (!canBuy) {

        throw new Error(
            "Exchange does not have enough liquidity for auto top-up."
        );

    }

    await purchaseWithNative(
        account,
        requiredNative
    );

    const updatedBalance =
        await getUtilityBalance(account);

    if (updatedBalance < requiredAmount) {

        throw new Error(
            "Automatic top-up did not reach the required balance."
        );

    }

    return { purchased: true, amount: missing };

}

// Legacy alias
export const autoTopupEVOZX = autoTopupUtility;
