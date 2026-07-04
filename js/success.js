import { formatUnits } from "https://esm.sh/ethers@6";

import {
    STORAGE,
    explorerTransaction
} from "./config.js";

import {
    copyToClipboard
} from "./utils.js";

import {
    initializeWallet
} from "./wallet.js";

// =====================================================
// DOM
// =====================================================

const $ = selector =>
    document.querySelector(selector);

function setText(id, value) {

    const element = $(id);

    if (!element) return;

    element.textContent = value ?? "-";

}

// =====================================================
// FORMAT
// =====================================================

function shortAddress(address) {

    if (!address) return "-";

    return (
        address.slice(0, 6) +
        "..." +
        address.slice(-4)
    );

}

function formatSupply(value) {

    try {

        return Number(
            formatUnits(value, 18)
        ).toLocaleString();

    }

    catch {

        return String(value);

    }

}

// =====================================================
// STORAGE
// =====================================================

function getDeploymentData() {

    try {

        const raw =
            localStorage.getItem(
                STORAGE.lastToken
            );

        if (!raw) {
            return null;
        }

        return JSON.parse(raw);

    }

    catch {

        return null;

    }

}

// =====================================================
// RENDER
// =====================================================

function renderDeployment(data) {

    setText(
        "#tokenName",
        data.name
    );

    setText(
        "#tokenSymbol",
        data.symbol
    );

    setText(
        "#tokenSupply",
        formatSupply(
            data.supply
        )
    );

    setText(
        "#tokenAddress",
        data.token
    );

    setText(
        "#creator",
        shortAddress(
            data.creator
        )
    );

    setText(
        "#chainId",
        String(data.chainId)
    );

    setText(
        "#txHash",
        shortAddress(
            data.hash
        )
    );

    setText(
        "#blockNumber",
        String(
            data.blockNumber ?? "-"
        )
    );

}

// =====================================================
// BUTTONS
// =====================================================

function bindExplorerButton(data) {

    const button =
        $("#openExplorer");

    if (!button) return;

    button.addEventListener(
        "click",
        () => {

            window.open(
                explorerTransaction(
                    data.hash
                ),
                "_blank"
            );

        }
    );

}

function bindTokenButton(data) {

    const button =
        $("#openToken");

    if (!button) return;

    button.addEventListener(
        "click",
        () => {

            window.location.href =
                `./token.html?address=${data.token}`;

        }
    );

}

function bindCopyButton(data) {

    const button =
        $("#copyAddress");

    if (!button) return;

    button.addEventListener(
        "click",
        async () => {

            const copied =
                await copyToClipboard(
                    data.token
                );

            if (!copied) return;

            const original =
                button.textContent;

            button.textContent =
                "Copied";

            setTimeout(
                () => {

                    button.textContent =
                        original;

                },
                1500
            );

        }
    );

}

function bindDownloadButton() {

    const button =
        $("#downloadVerification");

    if (!button) return;

    button.addEventListener(
        "click",
        () => {

            window.location.href =
                "./docs/standard-input.zip";

        }
    );

}

// =====================================================
// SUCCESS
// =====================================================

function renderSuccessPage() {

    const deployment =
        getDeploymentData();

    if (!deployment) {

        window.location.href =
            "./launch.html";

        return;

    }

    renderDeployment(
        deployment
    );

    bindExplorerButton(
        deployment
    );

    bindTokenButton(
        deployment
    );

    bindCopyButton(
        deployment
    );

    bindDownloadButton();

}

// =====================================================
// INIT
// =====================================================

function initialize() {

    initializeWallet();

    renderSuccessPage();

}

document.addEventListener(
    "DOMContentLoaded",
    initialize
);

// =====================================================
// EXPORTS
// =====================================================

export {
    initialize,
    renderSuccessPage
};
