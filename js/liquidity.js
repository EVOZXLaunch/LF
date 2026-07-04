import {
    Contract,
    parseUnits,
    parseEther,
    ZeroAddress
} from "https://esm.sh/ethers@6";

import {
    CONTRACTS,
    ABI,
    isDexReady
} from "./config.js";

import {
    getSigner,
    getAccount
} from "./wallet.js";

// =====================================================
// ABI LOADING
// =====================================================

let routerAbi = null;

let dexFactoryAbi = null;

let erc20Abi = null;

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

async function getRouterAbi() {

    if (!routerAbi) {

        routerAbi =
            await loadAbi(ABI.router);

    }

    return routerAbi;

}

async function getDexFactoryAbi() {

    if (!dexFactoryAbi) {

        dexFactoryAbi =
            await loadAbi(ABI.dexFactory);

    }

    return dexFactoryAbi;

}

async function getErc20Abi() {

    if (!erc20Abi) {

        erc20Abi =
            await loadAbi(ABI.erc20);

    }

    return erc20Abi;

}

// =====================================================
// CONTRACTS
// =====================================================

function requireDex() {

    if (!isDexReady()) {

        throw new Error(
            "No DEX router configured for this network yet. " +
            "Ask the platform owner to set one in config.js."
        );

    }

}

async function getRouter() {

    requireDex();

    const signer =
        getSigner();

    if (!signer) {

        throw new Error(
            "Wallet not connected."
        );

    }

    return new Contract(

        CONTRACTS.dexRouter,

        await getRouterAbi(),

        signer

    );

}

async function getDexFactory(routerContract) {

    const factoryAddress =
        await routerContract.factory();

    return new Contract(

        factoryAddress,

        await getDexFactoryAbi(),

        routerContract.runner

    );

}

async function getTokenWrite(tokenAddress) {

    const signer =
        getSigner();

    if (!signer) {

        throw new Error(
            "Wallet not connected."
        );

    }

    return new Contract(

        tokenAddress,

        await getErc20Abi(),

        signer

    );

}

// =====================================================
// HELPERS
// =====================================================

function applySlippage(amount, slippagePercent) {

    // amount * (100 - slippage) / 100, done in integer math
    // to stay precise with bigint token amounts.
    const bps =
        BigInt(
            Math.round((100 - slippagePercent) * 100)
        );

    return (amount * bps) / 10_000n;

}

function deadlineInMinutes(minutes = 20) {

    return BigInt(
        Math.floor(Date.now() / 1000) + minutes * 60
    );

}

// =====================================================
// ADD LIQUIDITY (token + native coin)
// =====================================================
//
// Steps, in order — each one checked so nothing gets
// silently skipped and no step reverts unnoticed:
//   1. approve the router to pull the token amount
//   2. call addLiquidityETH with a slippage-protected minimum
//   3. resolve the resulting pair address from the DEX factory
//   4. call token.setPair(pair, true) so buy/sell tax detection
//      recognizes the new pair (owner-only, matches ERC20Max)
// =====================================================

export async function addLiquidityNative({
    tokenAddress,
    tokenAmount,
    nativeAmount,
    tokenDecimals = 18,
    slippagePercent = 2,
    registerPair = true
}) {

    requireDex();

    const account =
        getAccount();

    if (!account) {

        throw new Error(
            "Wallet not connected."
        );

    }

    if (!tokenAmount || Number(tokenAmount) <= 0) {

        throw new Error(
            "Token amount must be greater than zero."
        );

    }

    if (!nativeAmount || Number(nativeAmount) <= 0) {

        throw new Error(
            "Native amount must be greater than zero."
        );

    }

    const amountTokenDesired =
        parseUnits(
            String(tokenAmount),
            tokenDecimals
        );

    const amountNativeDesired =
        parseEther(
            String(nativeAmount)
        );

    const amountTokenMin =
        applySlippage(
            amountTokenDesired,
            slippagePercent
        );

    const amountNativeMin =
        applySlippage(
            amountNativeDesired,
            slippagePercent
        );

    // 1. Approve
    const token =
        await getTokenWrite(tokenAddress);

    const allowance =
        await token.allowance(
            account,
            CONTRACTS.dexRouter
        );

    if (allowance < amountTokenDesired) {

        const approveTx =
            await token.approve(
                CONTRACTS.dexRouter,
                amountTokenDesired
            );

        await approveTx.wait();

    }

    // 2. Add liquidity
    const router =
        await getRouter();

    const tx =
        await router.addLiquidityETH(

            tokenAddress,

            amountTokenDesired,

            amountTokenMin,

            amountNativeMin,

            account,

            deadlineInMinutes(),

            { value: amountNativeDesired }

        );

    const receipt =
        await tx.wait();

    // 3. Resolve pair address
    let pairAddress = ZeroAddress;

    try {

        const dexFactory =
            await getDexFactory(router);

        const weth =
            await router.WETH();

        pairAddress =
            await dexFactory.getPair(
                tokenAddress,
                weth
            );

    }

    catch (error) {

        console.warn(
            "Unable to resolve pair address:",
            error
        );

    }

    // 4. Register pair on the token for tax detection
    let pairRegistered = false;

    if (
        registerPair &&
        pairAddress &&
        pairAddress !== ZeroAddress
    ) {

        try {

            const tokenOwnerTx =
                await token.setPair(
                    pairAddress,
                    true
                );

            await tokenOwnerTx.wait();

            pairRegistered = true;

        }

        catch (error) {

            // Not fatal — liquidity is already added either way.
            // Most common cause: caller isn't the token owner.
            console.warn(
                "Could not auto-register pair (owner-only):",
                error?.shortMessage || error?.message
            );

        }

    }

    return {

        hash: tx.hash,

        blockNumber: receipt.blockNumber,

        pairAddress,

        pairRegistered

    };

}

export function canAddLiquidity() {

    return isDexReady();

}
