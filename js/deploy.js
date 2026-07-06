import {
    ZeroAddress,
    isAddress
} from "https://esm.sh/ethers@6";

import {
    NETWORK,
    STORAGE
} from "./config.js";

import {
    getAccount
} from "./wallet.js";

import {
    validateConfig
} from "./validation.js";

import {
    isSymbolAvailable,
    findAvailablePaymentMethod,
    getDeployFee,
    quoteNativeFee,
    getUtilityBalance,
    getUtilityAllowance,
    approveUtility,
    deployWithNative,
    deployWithToken
} from "./factory.js";

import {
    autoTopupUtility
} from "./exchange.js";

// =====================================================
// HELPERS
// =====================================================

function normalizeString(value) {

    return String(value ?? "").trim();

}

function normalizeNumber(value) {

    const number = Number(value);

    return Number.isFinite(number) ? number : 0;

}

function validWallet(address) {

    address = normalizeString(address);

    return (
        address &&
        isAddress(address) &&
        address.toLowerCase() !== ZeroAddress
    )
        ? address
        : null;

}

// =====================================================
// TAX SHARE NORMALIZATION
// =====================================================
//
// The contract REQUIRES every share (burn + marketing +
// development + treasury + liquidity + buyback + charity)
// to sum to EXACTLY 100, and requires a non-zero wallet for
// any share > 0 — this is checked unconditionally, even if
// buy/sell/transfer tax itself is disabled.
//
// The user has direct, explicit control over every share via
// the wizard — validateConfig() (validation.js) is what
// actually blocks deploy if they don't sum to 100 or a wallet
// is missing for a non-zero share, so this function is a thin,
// literal read of the form with just two safety nets:
//   1. If the user leaves every share at 0, default to 100%
//      burn (always valid, never needs a wallet).
//   2. Any share left at 0 gets ZeroAddress as its wallet
//      regardless of what was typed, so a stray address in an
//      unused field can never cause an unexpected transfer.
// =====================================================

function buildTaxShares(form) {

    const shareOf = (value) =>
        Math.min(100, Math.max(0, normalizeNumber(value)));

    let burnShare = shareOf(form.burnTaxShare);
    let marketingShare = shareOf(form.marketingTaxShare);
    let developmentShare = shareOf(form.developmentTaxShare);
    let treasuryShare = shareOf(form.treasuryTaxShare);
    let liquidityShare = shareOf(form.liquidityTaxShare);
    let buybackShare = shareOf(form.buybackTaxShare);
    let charityShare = shareOf(form.charityTaxShare);

    const total =
        burnShare + marketingShare + developmentShare +
        treasuryShare + liquidityShare + buybackShare + charityShare;

    if (total === 0) {

        // Nothing configured — safest valid default.
        burnShare = 100;

    }

    return {

        burnShare,
        marketingShare,
        developmentShare,
        treasuryShare,
        liquidityShare,
        buybackShare,
        charityShare,

        marketingWallet:
            marketingShare > 0 ? (validWallet(form.marketingWallet) || ZeroAddress) : ZeroAddress,

        developmentWallet:
            developmentShare > 0 ? (validWallet(form.developmentWallet) || ZeroAddress) : ZeroAddress,

        treasuryWallet:
            treasuryShare > 0 ? (validWallet(form.treasuryWallet) || ZeroAddress) : ZeroAddress,

        liquidityWallet:
            liquidityShare > 0 ? (validWallet(form.liquidityWallet) || ZeroAddress) : ZeroAddress,

        buybackWallet:
            buybackShare > 0 ? (validWallet(form.buybackWallet) || ZeroAddress) : ZeroAddress,

        charityWallet:
            charityShare > 0 ? (validWallet(form.charityWallet) || ZeroAddress) : ZeroAddress

    };

}

// =====================================================
// BUILD TOKEN CONFIG (on-chain struct)
// =====================================================

export async function buildDeployment(form) {

    const account = getAccount();

    if (!account) {

        throw new Error(
            "Wallet not connected."
        );
    }

    const supplyRaw =
        BigInt(
            Math.max(0, Math.trunc(Number(form.supply) || 0))
        );

    const initialSupply =
        supplyRaw * 1_000_000_000_000_000_000n;

    // Max Supply is optional in the UI. If left blank (or set
    // below Total Supply, which the contract rejects), fall
    // back to a sane default: the initial supply itself, or
    // 10x it when Mintable is on so minting has real headroom.
    const maxSupplyRaw =
        BigInt(
            Math.max(0, Math.trunc(Number(form.maxSupply) || 0))
        ) * 1_000_000_000_000_000_000n;

    const maxSupply =
        maxSupplyRaw >= initialSupply
            ? maxSupplyRaw
            : (form.mintable ? initialSupply * 10n : initialSupply);

    const taxShares =
        buildTaxShares(form);

    const buyTaxEnabled =
        Boolean(form.buyTaxEnabled);

    const sellTaxEnabled =
        Boolean(form.sellTaxEnabled);

    const transferTaxEnabled =
        Boolean(form.transferTaxEnabled);

    const buyTax =
        buyTaxEnabled
            ? Math.min(10, Math.max(0, normalizeNumber(form.buyTax)))
            : 0;

    const sellTax =
        sellTaxEnabled
            ? Math.min(10, Math.max(0, normalizeNumber(form.sellTax)))
            : 0;

    const transferTax =
        transferTaxEnabled
            ? Math.min(10, Math.max(0, normalizeNumber(form.transferTax)))
            : 0;

    const maxWalletEnabled =
        Boolean(form.maxWalletEnabled);

    const maxTxEnabled =
        Boolean(form.maxTxEnabled);

    // Contract reverts if enabled but percent is 0 — enforce
    // a sane minimum here so the toggle can never produce an
    // invalid combination.
    const maxWalletPercent =
        maxWalletEnabled
            ? Math.min(100, Math.max(1, normalizeNumber(form.maxWalletPercent)))
            : 0;

    const maxTxPercent =
        maxTxEnabled
            ? Math.min(100, Math.max(1, normalizeNumber(form.maxTxPercent)))
            : 0;

    const antiBot =
        Boolean(form.antiBot);

    const tradingDelay =
        Boolean(form.tradingDelay);

    const antiBotBlocks =
        antiBot
            ? Math.max(1, Math.trunc(normalizeNumber(form.antiBotBlocks)))
            : 0;

    const tradingDelaySeconds =
        tradingDelay
            ? Math.max(1, Math.trunc(normalizeNumber(form.tradingDelaySeconds)))
            : 0;

    const config = {

        name: normalizeString(form.name),

        symbol: normalizeString(form.symbol).toUpperCase(),

        owner: account,

        supply: {

            initialSupply,

            maxSupply,

            mintable: Boolean(form.mintable),

            burnable: Boolean(form.burnable)

        },

        security: {

            antiBot,

            blacklist: Boolean(form.blacklist),

            whitelist: Boolean(form.whitelist),

            tradingDelay,

            maxWalletEnabled,

            maxTxEnabled,

            maxWalletPercent,

            maxTxPercent,

            antiBotBlocks,

            tradingDelaySeconds

        },

        taxes: {

            buyTaxEnabled,

            sellTaxEnabled,

            transferTaxEnabled,

            buyTax,

            sellTax,

            transferTax,

            ...taxShares

        }

    };

    const metadata = {

        website: normalizeString(form.website),

        telegram: normalizeString(form.telegram),

        twitter: normalizeString(form.twitter),

        logoURI: normalizeString(form.logoURI)

    };

    return { config, metadata, account };

}

// =====================================================
// PREVIEW
// =====================================================

export async function getDeploymentPreview(form) {

    const account = getAccount();

    if (!account) {

        throw new Error(
            "Wallet not connected."
        );

    }

    const { config, metadata } =
        await buildDeployment(form);

    const validationError =
        validateConfig(form);

    if (validationError) {

        throw new Error(validationError);

    }

    const method =
        await findAvailablePaymentMethod();

    if (!method) {

        throw new Error(
            "No enabled payment method found on this network."
        );

    }

    if (method.isNative) {

        const quote =
            await quoteNativeFee(method.symbol);

        return {

            account,

            config,

            metadata,

            method,

            fee: quote.nativeFee,

            feeSymbol: NETWORK.symbol,

            balance: null,

            allowance: null,

            enoughBalance: true,

            approved: true

        };

    }

    const feeInfo =
        await getDeployFee(method.symbol);

    const balance =
        await getUtilityBalance(account);

    const allowance =
        await getUtilityAllowance(account);

    return {

        account,

        config,

        metadata,

        method,

        fee: feeInfo.deployFee,

        feeSymbol: method.symbol,

        balance,

        allowance,

        enoughBalance: balance >= feeInfo.deployFee,

        approved: allowance >= feeInfo.deployFee

    };

}

// =====================================================
// STORAGE
// =====================================================

export function saveLastDeployment(deployment) {

    localStorage.setItem(

        STORAGE.lastToken,

        JSON.stringify(deployment)

    );

}

export function saveDeploymentHistory(deployment) {

    let history = [];

    try {

        history = JSON.parse(

            localStorage.getItem(
                STORAGE.deployHistory
            ) || "[]"

        );

        if (!Array.isArray(history)) {

            history = [];

        }

    }

    catch {

        history = [];

    }

    history.unshift(deployment);

    localStorage.setItem(

        STORAGE.deployHistory,

        JSON.stringify(history)

    );

}

// =====================================================
// DEPLOY
// =====================================================

export async function deployToken(form) {

    const account = getAccount();

    if (!account) {

        throw new Error(
            "Wallet not connected."
        );

    }

    const validationError =
        validateConfig(form);

    if (validationError) {

        throw new Error(validationError);

    }

    const symbol =
        normalizeString(form.symbol).toUpperCase();

    const available =
        await isSymbolAvailable(symbol);

    if (!available) {

        throw new Error(
            "Symbol already exists."
        );

    }

    const { config, metadata } =
        await buildDeployment(form);

    const method =
        await findAvailablePaymentMethod();

    if (!method) {

        throw new Error(
            "No enabled payment method found on this network. Please contact the platform owner."
        );

    }

    let result;

    if (method.isNative) {

        // NATIVE PAYMENT — safest path, no approval needed.
        // Re-quote right before sending so the value always
        // matches current on-chain fee (avoids a stale-quote
        // revert if the fee changed between page load and click).
        const quote =
            await quoteNativeFee(method.symbol);

        result =
            await deployWithNative(
                config,
                metadata,
                quote.nativeFee
            );

    }

    else {

        // TOKEN PAYMENT — top up balance if needed, then
        // approve exactly the fee amount, then deploy via
        // deployCreate2 (random salt) so no signature/permit
        // domain mismatch can cause a revert.
        const feeInfo =
            await getDeployFee(method.symbol);

        const balance =
            await getUtilityBalance(account);

        if (balance < feeInfo.deployFee) {

            await autoTopupUtility(
                feeInfo.deployFee
            );

        }

        const allowance =
            await getUtilityAllowance(account);

        if (allowance < feeInfo.deployFee) {

            await approveUtility(
                feeInfo.deployFee
            );

        }

        result =
            await deployWithToken(
                config,
                metadata,
                method.symbol
            );

    }

    const deployment = {

        name: result.name,

        symbol: result.symbol,

        token: result.token,

        creator: result.creator,

        supply: result.initialSupply.toString(),

        chainId: NETWORK.chainId.toString(),

        chainName: NETWORK.name,

        paymentSymbol: method.symbol,

        hash: result.hash,

        blockNumber: result.blockNumber,

        deployedAt: Date.now()

    };

    saveLastDeployment(deployment);

    saveDeploymentHistory(deployment);

    window.location.href =
        `./success.html?token=${result.token}`;

}

// =====================================================
// UTILITIES
// =====================================================

export async function canDeploy(form) {

    try {

        const preview =
            await getDeploymentPreview(form);

        return preview.enoughBalance;

    }

    catch {

        return false;

    }

}

export async function estimateDeployment(form) {

    const preview =
        await getDeploymentPreview(form);

    return {

        fee: preview.fee,

        feeSymbol: preview.feeSymbol,

        method: preview.method,

        balance: preview.balance,

        allowance: preview.allowance,

        approved: preview.approved,

        enoughBalance: preview.enoughBalance

    };

}
