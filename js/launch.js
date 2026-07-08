import {
    formatUnits
} from "https://esm.sh/ethers@6";

import {
    NETWORK
} from "./config.js";

import {
    getLFTBalance
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

import {
    friendlyError
} from "./utils.js";

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

        maxSupply:
            getNumber("maxSupply"),

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

        // ANTI-BOT / ACCESS CONTROL

        antiBot:
            isChecked("antiBot"),

        antiBotBlocks:
            getNumber("antiBotBlocks"),

        tradingDelay:
            isChecked("tradingDelay"),

        tradingDelaySeconds:
            getNumber("tradingDelaySeconds"),

        blacklist:
            isChecked("blacklist"),

        whitelist:
            isChecked("whitelist"),

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

        transferTaxEnabled:
            isChecked(
                "transferTaxEnabled"
            ),

        transferTax:
            getNumber(
                "transferTax"
            ),

        burnTaxShare:
            getNumber(
                "burnTaxShare"
            ),

        marketingTaxShare:
            getNumber(
                "marketingTaxShare"
            ),

        developmentTaxShare:
            getNumber(
                "developmentTaxShare"
            ),

        treasuryTaxShare:
            getNumber(
                "treasuryTaxShare"
            ),

        liquidityTaxShare:
            getNumber(
                "liquidityTaxShare"
            ),

        buybackTaxShare:
            getNumber(
                "buybackTaxShare"
            ),

        charityTaxShare:
            getNumber(
                "charityTaxShare"
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

        treasuryWallet:
            getValue(
                "treasuryWallet"
            ),

        liquidityWallet:
            getValue(
                "liquidityWallet"
            ),

        buybackWallet:
            getValue(
                "buybackWallet"
            ),

        charityWallet:
            getValue(
                "charityWallet"
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

logoURI:
    getValue(
        "logoURI"
    )

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

    const antiBot =

        isChecked("antiBot");

    const tradingDelay =

        isChecked("tradingDelay");

    const buyTaxEnabled =

        isChecked(
            "buyTaxEnabled"
        );

    const sellTaxEnabled =

        isChecked(
            "sellTaxEnabled"
        );

    const transferTaxEnabled =

        isChecked(
            "transferTaxEnabled"
        );

    const taxEnabled =

        buyTaxEnabled ||
        sellTaxEnabled ||
        transferTaxEnabled;

    enable(
        "maxWalletPercent",
        maxWalletEnabled
    );

    enable(
        "maxTxPercent",
        maxTxEnabled
    );

    enable(
        "antiBotBlocks",
        antiBot
    );

    enable(
        "tradingDelaySeconds",
        tradingDelay
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
        "transferTax",
        transferTaxEnabled
    );

    const shareFields = [
        "burnTaxShare",
        "marketingTaxShare",
        "developmentTaxShare",
        "treasuryTaxShare",
        "liquidityTaxShare",
        "buybackTaxShare",
        "charityTaxShare"
    ];

    const walletFields = [
        "marketingWallet",
        "developmentWallet",
        "treasuryWallet",
        "liquidityWallet",
        "buybackWallet",
        "charityWallet"
    ];

    shareFields.forEach(
        id => enable(id, taxEnabled)
    );

    walletFields.forEach(
        id => enable(id, taxEnabled)
    );

    updateTaxShareTotal(shareFields);

}

// =====================================================
// TAX SHARE TOTAL (must equal exactly 100 on-chain)
// =====================================================

function updateTaxShareTotal(shareFields) {

    const badge =
        $("taxShareTotal");

    if (!badge) {

        return;

    }

    const total =
        shareFields.reduce(
            (sum, id) => sum + getNumber(id),
            0
        );

    badge.textContent =
        `Total: ${total}/100%`;

    badge.className =
        total === 100
            ? "badge badge-green"
            : "badge badge-red";

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
            "walletLFTBalance",
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
        await getLFTBalance(
            account
        );

    setText(

        "walletLFTBalance",

        `${formatToken(
            balance
        )} ${NETWORK.contracts?.utilitySymbol || "LFT"}`

    );

}

catch (error) {

    console.error(
        "UTILITY BALANCE PREVIEW ERROR:",
        error
    );

    setText(
        "walletLFTBalance",
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

        setText("lftBalance", "-");

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

            setText("lftBalance", "—");

            setText("requiredEVOZ", "Paid in " + NETWORK.symbol);

        }

        else {

            setText(

                "lftBalance",

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

            friendlyError(error)

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
        friendlyError(error);

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
// QUICK NAV + LIVE FEATURE SUMMARY
// =====================================================

const TOGGLE_FEATURE_IDS = [

    "burnable",
    "mintable",
    "ownershipEnabled",
    "maxWalletEnabled",
    "maxTxEnabled",
    "antiBot",
    "tradingDelay",
    "blacklist",
    "whitelist",
    "buyTaxEnabled",
    "sellTaxEnabled",
    "transferTaxEnabled"

];

const TAX_INPUT_PAIRS = [

    ["buyTaxEnabled", "buyTax"],
    ["sellTaxEnabled", "sellTax"],
    ["transferTaxEnabled", "transferTax"]

];

function updateFeatureSummary() {

    const countEl =
        document.getElementById("featureCount");

    const taxEl =
        document.getElementById("liveTaxTotal");

    if (!countEl || !taxEl) {

        return;

    }

    let enabled = 0;

    TOGGLE_FEATURE_IDS.forEach(
        id => {

            const el =
                document.getElementById(id);

            if (el && el.checked) {

                enabled++;

            }

        }
    );

    countEl.textContent = String(enabled);

    let totalTax = 0;

    TAX_INPUT_PAIRS.forEach(
        ([toggleId, valueId]) => {

            const toggle =
                document.getElementById(toggleId);

            const value =
                document.getElementById(valueId);

            if (toggle && toggle.checked && value) {

                totalTax += Number(value.value) || 0;

            }

        }
    );

    taxEl.textContent = String(totalTax);

}

function initializeFeatureSummary() {

    updateFeatureSummary();

    document.addEventListener(
        "input",
        updateFeatureSummary
    );

    document.addEventListener(
        "change",
        updateFeatureSummary
    );

}

function initializeQuickNav() {

    const pills =
        document.querySelectorAll(
            ".wizard-nav-pill"
        );

    pills.forEach(
        pill => {

            pill.addEventListener(

                "click",

                () => {

                    const target =
                        pill.dataset.goto;

                    const section =
                        document.querySelector(
                            `.accordion[data-section="${target}"]`
                        );

                    if (!section) {

                        return;

                    }

                    section.classList.add("open");

                    section.scrollIntoView({

                        behavior: "smooth",

                        block: "start"

                    });

                }

            );

        }
    );

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

        initializeQuickNav();

        initializeFeatureSummary();

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

            friendlyError(error)

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
