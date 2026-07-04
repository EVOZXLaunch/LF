// ======================================================
// LAUNCHFUTURE
// utils.js
// FINAL
// ======================================================

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
