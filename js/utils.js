// ======================================================
// LAUNCHFUTURE
// utils.js
// FINAL
// ======================================================

import { NETWORK } from "./config.js";

export async function copyToClipboard(text) {

    try {

        await navigator.clipboard.writeText(
            String(text)
        );

        return true;

    }

    catch (error) {

        console.error(error);

        return false;

    }

}

// ======================================================
// ADDRESS
// ======================================================

export function shortAddress(
    address,
    prefix = 6,
    suffix = 4
) {

    if (!address) {

        return "";

    }

    return (

        address.slice(0, prefix) +

        "..." +

        address.slice(-suffix)

    );

}

// ======================================================
// FORMAT NUMBER
// ======================================================

export function formatNumber(
    value,
    decimals = 2
) {

    const number =
        Number(value);

    if (
        Number.isNaN(number) ||
        !Number.isFinite(number)
    ) {

        return "0";

    }

    return number.toLocaleString(
        undefined,
        {
            minimumFractionDigits: 0,
            maximumFractionDigits: decimals
        }
    );

}

// ======================================================
// FORMAT DATE
// ======================================================

export function formatDate(timestamp) {

    if (!timestamp) {

        return "-";

    }

    return new Date(
        Number(timestamp)
    ).toLocaleString();

}

// ======================================================
// DOM
// ======================================================

export function $(selector) {

    return document.querySelector(
        selector
    );

}

export function $id(id) {

    return document.getElementById(
        id
    );

}

export function setText(
    id,
    value
) {

    const element =
        document.getElementById(id);

    if (!element) {

        return;

    }

    element.textContent =
        value ?? "";

}

export function setHTML(
    id,
    html
) {

    const element =
        document.getElementById(id);

    if (!element) {

        return;

    }

    element.innerHTML =
        html ?? "";

}

// ======================================================
// STORAGE
// ======================================================

export function saveStorage(
    key,
    value
) {

    localStorage.setItem(

        key,

        JSON.stringify(value)

    );

}

export function loadStorage(
    key,
    fallback = null
) {

    try {

        const raw =
            localStorage.getItem(key);

        if (!raw) {

            return fallback;

        }

        return JSON.parse(raw);

    }

    catch {

        return fallback;

    }

}

export function removeStorage(key) {

    localStorage.removeItem(key);

}

// ======================================================
// URL PARAMS
// ======================================================

export function getQueryParam(name) {

    return new URLSearchParams(

        window.location.search

    ).get(name);

}

// ======================================================
// DOWNLOAD
// ======================================================

export function downloadFile(
    filename,
    content,
    mime =
        "application/json"
) {

    const blob =
        new Blob(

            [content],

            {
                type: mime
            }

        );

    const url =
        URL.createObjectURL(
            blob
        );

    const link =
        document.createElement("a");

    link.href =
        url;

    link.download =
        filename;

    document.body.appendChild(
        link
    );

    link.click();

    link.remove();

    URL.revokeObjectURL(
        url
    );

}

// ======================================================
// STATUS
// ======================================================

export function showStatus(
    elementId,
    message,
    type = "info"
) {

    const element =
        document.getElementById(
            elementId
        );

    if (!element) {

        return;

    }

    element.textContent =
        message;

    element.dataset.type =
        type;

}

export function clearStatus(
    elementId
) {

    showStatus(
        elementId,
        ""
    );

}

// ======================================================
// DEBOUNCE
// ======================================================

export function debounce(
    callback,
    delay = 300
) {

    let timer;

    return (...args) => {

        clearTimeout(timer);

        timer = setTimeout(

            () => callback(...args),

            delay

        );

    };

}

// ======================================================
// SLEEP
// ======================================================

export function sleep(ms) {

    return new Promise(

        resolve =>

            setTimeout(

                resolve,

                ms

            )

    );

  }

// ======================================================
// FRIENDLY BLOCKCHAIN ERROR MESSAGE
// ======================================================
//
// ethers v6 errors are NOT safe to show as-is: `.message` on
// a CallExceptionError / insufficient-funds error includes the
// full raw transaction (calldata, hex value, nested RPC
// payload) serialized as one giant string. Showing that
// directly in a status bar or alert() produces an unreadable
// wall of hex — which is what native in-app wallet browsers
// (TokenPocket, MetaMask Mobile, etc.) end up displaying
// verbatim in their own "Tips" dialog.
//
// This always returns a short, human-readable string, no
// matter what shape the thrown error has.

export function friendlyError(error) {

    if (!error) {

        return "Something went wrong. Please try again.";

    }

    // Plain string was thrown/passed directly.
    if (typeof error === "string") {

        return error;

    }

    const code =
        error.code || error.info?.error?.code;

    // User closed the wallet prompt / tapped "Reject".
    if (code === "ACTION_REJECTED") {

        return "Transaction rejected in your wallet.";

    }

    // The RPC node reverted the call but didn't return a reason
    // (common on lightweight/custom-chain RPC nodes for
    // eth_estimateGas). The transaction genuinely can't succeed
    // as configured, but we can't say exactly why from here.
    if (
        code === "CALL_EXCEPTION" &&
        /missing revert data/i.test(error.shortMessage || "")
    ) {

        return (
            "The network rejected this transaction without giving a reason " +
            "(this can happen on EVOZ's RPC for certain configurations). " +
            "Double-check your token settings — especially tax shares, " +
            "wallet addresses, and the deployment fee — then try again."
        );

    }

    // Not enough native balance to cover value + gas.
    if (
        code === "INSUFFICIENT_FUNDS" ||
        /insufficient funds/i.test(error.shortMessage || "")
    ) {

        const have =
            extractWei(error, /have (\d+)/);

        const want =
            extractWei(error, /want (\d+)/);

        if (have !== null && want !== null) {

            const symbol =
                NETWORK.symbol || "";

            return (
                `Insufficient balance to cover the deployment fee + gas. ` +
                `You have ${formatWei(have)} ${symbol}, but need ${formatWei(want)} ${symbol}. ` +
                `Top up your wallet and try again.`
            );

        }

        return "Insufficient balance to cover the deployment fee and gas. Top up your wallet and try again.";

    }

    // Contract reverted with a reason string — this is the
    // cleanest field ethers exposes for that case.
    if (error.reason) {

        return error.reason;

    }

    // ethers v6 puts the clean one-line summary here; anything
    // after it in `.message` is the raw dump we want to avoid.
    if (error.shortMessage) {

        return error.shortMessage;

    }

    // Nested RPC error message, e.g. "err: insufficient funds...".
    const rpcMessage =
        error.info?.error?.message;

    if (rpcMessage && rpcMessage.length < 200) {

        return rpcMessage;

    }

    // Last resort — never return a multi-hundred-character
    // blob. Truncate hard so at least the dialog stays legible.
    const raw =
        error.message || String(error);

    return raw.length > 160
        ? raw.slice(0, 160) + "…"
        : raw;

}

function extractWei(error, pattern) {

    const haystack =
        error.info?.error?.message ||
        error.shortMessage ||
        error.message ||
        "";

    const match =
        haystack.match(pattern);

    return match ? BigInt(match[1]) : null;

}

function formatWei(wei) {

    const whole =
        wei / 1_000_000_000_000_000_000n;

    const fraction =
        wei % 1_000_000_000_000_000_000n;

    const fractionStr =
        fraction
            .toString()
            .padStart(18, "0")
            .slice(0, 4)
            .replace(/0+$/, "");

    return fractionStr
        ? `${whole}.${fractionStr}`
        : `${whole}`;

}
