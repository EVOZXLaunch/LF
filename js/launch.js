import {
    formatUnits
} from "https://esm.sh/ethers@6";

import {
    NETWORK
} from "./config.js";

import {
    getEVOZXBalance
} from "./factory.js";

import {
    validateConfig,
    checkSymbol
} from "./validation.js";

import {
    deployToken,
    buildDeployment,
    getDeploymentPreview
} from "./deploy.js";

import {
    getAccount,
    initializeWallet,
    onAccountChanged
} from "./wallet.js";

// =====================================================
// STATE
// =====================================================

let deployRunning = false;

let symbolTimer = null;

let initialized = false;

// =====================================================
// DOM
// =====================================================

function $(id) {

    return document.getElementById(id);

}

function setText(
    id,
    value
) {

    const element = $(id);

    if (!element) {

        return;

    }

    element.textContent =
        value ?? "";

}

function getValue(id) {

    const element = $(id);

    if (!element) {

        return "";

    }

    return element.value.trim();

}

function getNumber(id) {

    const value =
        Number(
            getValue(id)
        );

    return Number.isFinite(value)
        ? value
        : 0;

}

function isChecked(id) {

    const element = $(id);

    if (!element) {

        return false;

    }

    return element.checked;

}

function enable(
    id,
    state = true
) {

    const element = $(id);

    if (!element) {

        return;

    }

    element.disabled =
        !state;

}

// =====================================================
// STATUS
// =====================================================

function setStatus(message = "") {

    const panel =
        $("statusText");

    if (!panel) {

        return;

    }

    panel.textContent =
        message;

}

function clearStatus() {

    setStatus("");

}

// =====================================================
// FORMAT
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

function formatToken(value) {

    try {

        return Number(

            formatUnits(
                value,
                18
            )

        ).toLocaleString();

    }

    catch {

        return "0";

    }

}

// =====================================================
// FORM DATA
// =====================================================

export function getFormData() {

    return {

        // BASIC

        name:
            getValue("name"),

        symbol:
            getValue("symbol"),

        supply:
            getNumber("supply"),

        // FEATURES

        burnable:
            isChecked("burnable"),

        mintable:
            isChecked("mintable"),

        ownershipEnabled:
            isChecked(
                "ownershipEnabled"
            ),

        // SECURITY

        maxWalletEnabled:
            isChecked(
                "maxWalletEnabled"
            ),

        maxWalletPercent:
            getNumber(
                "maxWalletPercent"
            ),

        maxTxEnabled:
            isChecked(
                "maxTxEnabled"
            ),

        maxTxPercent:
            getNumber(
                "maxTxPercent"
            ),

        // TRADING

        tradingControlEnabled:
            isChecked(
                "tradingControlEnabled"
            ),

        tradingEnabled:
            isChecked(
                "tradingEnabled"
            ),

        // TAX

        buyTaxEnabled:
            isChecked(
                "buyTaxEnabled"
            ),

        buyTax:
            getNumber(
                "buyTax"
            ),

        sellTaxEnabled:
            isChecked(
                "sellTaxEnabled"
            ),

        sellTax:
            getNumber(
                "sellTax"
            ),

        burnTaxShare:
            getNumber(
                "burnTaxShare"
            ),

        // WALLETS

        marketingWallet:
            getValue(
                "marketingWallet"
            ),

        developmentWallet:
            getValue(
                "developmentWallet"
            ),

        // LINKS

website:
    getValue(
        "website"
    ),

telegram:
    getValue(
        "telegram"
    ),

twitter:
    getValue(
        "twitter"
    ),

logoFile:
    document
        .getElementById(
            "logoFile"
        )
        ?.files?.[0] || null

    };

}
// =====================================================
// ACCORDION
// =====================================================

function initializeAccordion() {

    const accordions =

        document.querySelectorAll(
            ".accordion"
        );

    accordions.forEach(
        accordion => {

            const header =

                accordion.querySelector(
                    ".accordion-header"
                );

            if (!header) {

                return;

            }

            header.addEventListener(

                "click",

                () => {

                    accordion.classList.toggle(
                        "open"
                    );

                }

            );

        }

    );

}

// =====================================================
// FEATURE STATE
// =====================================================

function updateFeatureState() {

    const maxWalletEnabled =

        isChecked(
            "maxWalletEnabled"
        );

    const maxTxEnabled =

        isChecked(
            "maxTxEnabled"
        );

    const tradingControlEnabled =

        isChecked(
            "tradingControlEnabled"
        );

    const buyTaxEnabled =

        isChecked(
            "buyTaxEnabled"
        );

    const sellTaxEnabled =

        isChecked(
            "sellTaxEnabled"
        );

    const taxEnabled =

        buyTaxEnabled ||
        sellTaxEnabled;

    enable(
        "maxWalletPercent",
        maxWalletEnabled
    );

    enable(
        "maxTxPercent",
        maxTxEnabled
    );

    enable(
        "tradingEnabled",
        tradingControlEnabled
    );

    enable(
        "buyTax",
        buyTaxEnabled
    );

    enable(
        "sellTax",
        sellTaxEnabled
    );

    enable(
        "burnTaxShare",
        taxEnabled
    );

    enable(
        "marketingWallet",
        taxEnabled
    );

    enable(
        "developmentWallet",
        taxEnabled
    );

}

// =====================================================
// SYMBOL STATUS
// =====================================================

async function updateSymbolStatus() {

    const badge =
        $("symbolStatus");

    if (!badge) {

        return;

    }

    const symbol =
        getValue("symbol");

    if (!symbol) {

        badge.textContent = "";

        badge.className =
            "badge";

        return;

    }

    try {

        const result =
            await checkSymbol(
                symbol
            );

        if (result?.exists) {

            badge.textContent =
                "Already Used";

            badge.className =
                "badge badge-red";

            return;

        }

        badge.textContent =
            "Available";

        badge.className =
            "badge badge-green";

    }

    catch (error) {

        console.error(error);

        badge.textContent =
            "";

        badge.className =
            "badge";

    }

}

function scheduleSymbolCheck() {

    clearTimeout(
        symbolTimer
    );

    symbolTimer = setTimeout(

        async () => {

            await updateSymbolStatus();

        },

        400

    );

}

// =====================================================
// VALIDATION
// =====================================================

function validateForm() {

    try {

        const form =
            getFormData();

        const error =
            validateConfig(
                form
            );

        if (error) {

            setStatus(error);

            return false;

        }

        clearStatus();

        return true;

    }

    catch (error) {

        console.error(error);

        setStatus(

            error.message ||

            "Validation failed."

        );

        return false;

    }

}

// =====================================================
// FORM EVENTS
// =====================================================

function bindFormInputs() {

    document

        .querySelectorAll(
            "input, textarea"
        )

        .forEach(element => {

            element.addEventListener(

                "input",

                async () => {

                    updateFeatureState();

                    validateForm();

                    scheduleSymbolCheck();

                    await refreshPreview();

                }

            );

            element.addEventListener(

                "change",

                async () => {

                    updateFeatureState();

                    validateForm();

                    scheduleSymbolCheck();

                    await refreshPreview();

                }

            );

        });

}
// =====================================================
// WALLET PREVIEW
// =====================================================

async function updateWalletPreview() {

    const account =
        getAccount();

    if (!account) {

        setText(
            "walletAddress",
            "Not Connected"
        );

        setText(
            "walletEVOZBalance",
            "-"
        );

        setText(
            "walletEVOZXBalance",
            "-"
        );

        return;

    }

    setText(
        "walletAddress",
        shortAddress(
            account
        )
    );

    try {

        const nativeBalance =

            await window.ethereum.request({

                method:
                    "eth_getBalance",

                params: [

                    account,

                    "latest"

                ]

            });

        setText(

            "walletEVOZBalance",

            Number(

                formatUnits(

                    BigInt(
                        nativeBalance
                    ),

                    18

                )

            ).toLocaleString()

        );

    }

    catch (error) {

    console.log(
        "PREVIEW MESSAGE:",
        error?.message
    );

    console.log(
        "PREVIEW STACK:",
        error?.stack
    );

    console.log(
        "PREVIEW ERROR:",
        error
    );

    setText(
        "deploymentFee",
        "-"
    );

    setText(
        "readyStatus",
        error?.message || "Preview Error"
    );

    }

    try {

    const balance =
        await getEVOZXBalance(
            account
        );

    setText(

        "walletEVOZXBalance",

        `${formatToken(
            balance
        )} ${NETWORK.contracts?.utilitySymbol || "EVOZX"}`

    );

}

catch (error) {

    console.error(
        "UTILITY BALANCE PREVIEW ERROR:",
        error
    );

    setText(
        "walletEVOZXBalance",
        "-"
    );

}
    
}

// =====================================================
// DEPLOYMENT PREVIEW
// =====================================================

async function refreshPreview() {

    const account =
        getAccount();

    if (!account) {

        setText("deploymentFee", "-");

        setText("evozxBalance", "-");

        setText("requiredEVOZ", "-");

        setText("readyStatus", "Connect Wallet");

        return;

    }

    if (!validateForm()) {

        setText("deploymentFee", "-");

        setText("readyStatus", "Invalid Configuration");

        return;

    }

    const symbol =
        getValue("symbol");

    if (symbol) {

        try {

            const result =
                await checkSymbol(symbol);

            if (result?.exists) {

                setText("deploymentFee", "-");

                setText("readyStatus", "Symbol Already Used");

                return;

            }

        }

        catch (error) {

            console.error("SYMBOL CHECK ERROR:", error);

        }

    }

    try {

        const form =
            getFormData();

        const preview =
            await getDeploymentPreview(form);

        setText(

            "deploymentFee",

            `${formatToken(preview.fee)} ${preview.feeSymbol}`

        );

        if (preview.method.isNative) {

            setText("evozxBalance", "—");

            setText("requiredEVOZ", "Paid in " + NETWORK.symbol);

        }

        else {

            setText(

                "evozxBalance",

                `${formatToken(preview.balance)} ${preview.feeSymbol}`

            );

            setText(

                "requiredEVOZ",

                preview.enoughBalance ? "OK" : "Auto Top-up"

            );

        }

        if (!preview.enoughBalance) {

            setText(

                "readyStatus",

                preview.method.isNative
                    ? `Insufficient ${NETWORK.symbol} balance`
                    : "Auto Top-up Required"

            );

            return;

        }

        setText("readyStatus", "Ready To Deploy");

    }

    catch (error) {

        console.error("PREVIEW ERROR:", error);

        setText("deploymentFee", "-");

        setText("requiredEVOZ", "Auto");

        setText(

            "readyStatus",

            error?.message || "Preview Error"

        );

    }

}

// =====================================================
// WALLET LISTENERS
// =====================================================

function bindWalletListeners() {

    onAccountChanged(

        async () => {

            await updateWalletPreview();

            await refreshPreview();

        }

    );

}
// =====================================================
// DEPLOY BUTTON
// =====================================================

function setDeployLoading(state) {

    deployRunning = state;

    const button =
        $("deployButton");

    if (!button) {

        return;

    }

    button.disabled =
        state;

    button.classList.toggle(
        "loading",
        state
    );

    button.textContent =

        state

            ? "Deploying..."

            : "Deploy Token";

}

// =====================================================
// DEPLOY
// =====================================================

async function onDeploy() {

    if (deployRunning) {

        return;

    }

    const account =
        getAccount();

    if (!account) {

        setStatus(
            "Please connect your wallet first."
        );

        return;

    }

    if (!validateForm()) {

        return;

    }

    try {

        setDeployLoading(
            true
        );

        setStatus(

            "Preparing deployment..."

        );

        const symbol =
            getValue(
                "symbol"
            );

        if (symbol) {

            const result =
                await checkSymbol(
                    symbol
                );

            if (
                result?.exists
            ) {

                throw new Error(
                    "Symbol already exists."
                );

            }

        }

        const form =
    getFormData();

if (form.logoFile) {

    const allowedTypes = [
    "image/png",
    "image/jpeg",
    "image/webp"
];

if (
    !allowedTypes.includes(
        form.logoFile.type
    )
) {

    alert(
        "Supported formats: PNG, JPG, WEBP"
    );

    return;

}

    if (
    form.logoFile.size >
    2 * 1024 * 1024
) {

    alert(
        "Logo max 2 MB."
    );

    return;

    }

    setStatus(
        "Uploading logo to IPFS..."
    );

    const fd =
        new FormData();

    fd.append(
        "file",
        form.logoFile
    );

    const response =
        await fetch(
            "/api/upload-logo",
            {
                method: "POST",
                body: fd
            }
        );

    const result =
        await response.json();

    if (!result.success) {

        throw new Error(
            result.error ||
            "Logo upload failed."
        );

    }

    form.logoURI =
        result.url;

    setStatus(
    `✅ Logo uploaded to IPFS
CID: ${result.cid}`
);

    await new Promise(
        resolve => setTimeout(
            resolve,
            1000
        )
    );
}

setStatus(
    "Waiting for wallet confirmation..."
);

await deployToken(
    form
);

        }

catch (error) {

    console.error(error);

    const message =
        error?.message ||
        "Deployment failed.";

    setStatus(message);

    alert(message);

}

finally {

    setDeployLoading(
        false
    );

}

}

// =====================================================
// EVENTS
// =====================================================

function bindDeployButton() {

    const button =
        $("deployButton");

    if (!button) {

        return;

    }

    button.addEventListener(

        "click",

        onDeploy

    );

}

// =====================================================
// INITIAL LOAD
// =====================================================

async function loadInitialState() {

    updateFeatureState();

    await updateWalletPreview();

    await updateSymbolStatus();

    await refreshPreview();

}

// =====================================================
// INITIALIZE
// =====================================================

async function initialize() {

    if (initialized) {

        return;

    }

    initialized = true;

    try {

        await initializeWallet();

        initializeAccordion();

        bindFormInputs();

        setupLogoPreview();

        bindDeployButton();

        bindWalletListeners();

        await loadInitialState();

    }

    catch (error) {

        console.error(
            error
        );

        setStatus(

            error?.message ||

            "Launch page initialization failed."

        );

    }

}

function setupLogoPreview() {

    const logoInput =
        document.getElementById(
            "logoFile"
        );

    const logoPreview =
        document.getElementById(
            "logoPreview"
        );

    const clearLogo =
        document.getElementById(
            "clearLogo"
        );

    if (!logoInput) {

        return;

    }

    logoInput.addEventListener(
        "change",
        event => {

            const file =
                event.target.files?.[0];

            if (!file) {

                if (logoPreview) {

                    logoPreview.style.display =
                        "none";

                }

                return;

            }

            const allowedTypes = [
    "image/png",
    "image/jpeg",
    "image/webp"
];

if (
    !allowedTypes.includes(
        file.type
    )
) {

    alert(
        "Supported formats: PNG, JPG, WEBP"
    );

    logoInput.value = "";

    return;

}

            if (
                file.size >
                2 * 1024 * 1024
            ) {

                alert(
                    "Maximum logo size is 2 MB."
                );

                logoInput.value = "";

                return;

            }

            const image =
                new Image();

            image.onload =
                () => {

                if (
                    image.width !==
                    image.height
                ) {

                    alert(
                        "Logo must be square (1:1)."
                    );

                    logoInput.value = "";

                    if (logoPreview) {

                        logoPreview.style.display =
                            "none";

                    }

                    return;

                }

                if (logoPreview) {

                    logoPreview.src =
                        URL.createObjectURL(
                            file
                        );

                    logoPreview.style.display =
                        "block";

                }

                if (clearLogo) {

                    clearLogo.style.display =
                        "inline-block";

                }

            };

            image.src =
                URL.createObjectURL(
                    file
                );

        }
    );

    clearLogo?.addEventListener(
        "click",
        () => {

            logoInput.value = "";

            if (logoPreview) {

                logoPreview.src = "";

                logoPreview.style.display =
                    "none";

            }

            clearLogo.style.display =
                "none";

        }
    );

}

// =====================================================
// STARTUP
// =====================================================

document.addEventListener(

    "DOMContentLoaded",

    initialize

);
