// =====================================================
// LaunchFuture
// UI Manager
// =====================================================

// =====================================================
// Constants
// =====================================================

export const TOTAL_STEPS = 6;

export const STEP_DATA = Object.freeze([

    {

        title:
            "Connect Wallet",

        description:
            "Connect your preferred EVM wallet before creating your ERC20MAX token."

    },

    {

        title:
            "ERC20MAX Configuration",

        description:
            "Configure the core information for your ERC20MAX token."

    },

    {

        title:
            "ERC20MAX Features",

        description:
            "Select the features that will be enabled."

    },

    {

        title:
            "Branding & Metadata",

        description:
            "Customize your project identity."

    },

    {

        title:
            "Review",

        description:
            "Review everything before deployment."

    },

    {

        title:
            "Deploy ERC20MAX",

        description:
            "Deploy your token directly from your wallet."

    }

]);

// =====================================================
// Helpers
// =====================================================

const $ = id =>

    document.getElementById(id);

const $$ = selector =>

    [

        ...document.querySelectorAll(

            selector

        )

    ];

// =====================================================
// State
// =====================================================

const state = {

    currentStep: 1,

    loading: false,

    modalOpen: false

};

// =====================================================
// DOM Cache
// =====================================================

const ui = {

    // Wizard

    wizardSteps: null,

    timelineSteps: null,

    timelineProgress: null,

    wizardTitle: null,

    wizardDescription: null,

    currentStepLabel: null,

    stepCounter: null,

    backButton: null,

    nextButton: null,

    deployButton: null,

    // Wallet

    connectWalletButton: null,

    walletConnectionStatus: null,

    walletProviderName: null,

    walletAddress: null,

    walletNetwork: null,

    walletBalance: null,

    walletBadge: null,

    // Preview

    previewName: null,

    previewSymbol: null,

    previewOwner: null,

    previewSupply: null,

    previewDecimals: null,

    previewFeatures: null,

    previewFee: null,

    previewGas: null,

    previewHealth: null,

    previewStatus: null,

    previewNetwork: null,

    // Review

    reviewName: null,

    reviewSymbol: null,

    reviewSupply: null,

    reviewDecimals: null,

    reviewOwner: null,

    reviewNetwork: null,

    // Deploy

    deployConsoleOutput: null,

    contractAddress: null,

    transactionHash: null,

    blockNumber: null,

    // Loading

    loadingOverlay: null,

    loadingText: null,

    // Toast

    toastContainer: null,

    toastTemplate: null,

    // Modal

    modal: null,

    modalTitle: null,

    modalBody: null,

    modalConfirm: null,

    modalCancel: null,

    modalClose: null

};

// =====================================================
// Initialize
// =====================================================

export function initUI() {

    // Wizard

    ui.wizardSteps =

        $$(".wizardStep");

    ui.timelineSteps =

        $$(".timelineStep");

    ui.timelineProgress =

        $("timelineProgress");

    ui.wizardTitle =

        $("wizardTitle");

    ui.wizardDescription =

        $("wizardDescription");

    ui.currentStepLabel =

        $("currentStepLabel");

    ui.stepCounter =

        $("stepCounter");

    ui.backButton =

        $("backButton");

    ui.nextButton =

        $("nextButton");

    ui.deployButton =

        $("deployButton");

    // Wallet

    ui.connectWalletButton =

        $("connectWalletButton");

    ui.walletConnectionStatus =

        $("walletConnectionStatus");

    ui.walletProviderName =

        $("walletProviderName");

    ui.walletAddress =

        $("walletAddress");

    ui.walletNetwork =

        $("walletNetwork");

    ui.walletBalance =

        $("walletBalance");

    ui.walletBadge =

        $("walletBadge");

    // Preview

    ui.previewName =

        $("previewName");

    ui.previewSymbol =

        $("previewSymbol");

    ui.previewOwner =

        $("previewOwner");

    ui.previewSupply =

        $("previewSupply");

    ui.previewDecimals =

        $("previewDecimals");

    ui.previewFeatures =

        $("previewFeatures");

    ui.previewFee =

        $("previewFee");

    ui.previewGas =

        $("previewGas");

    ui.previewHealth =

        $("previewHealth");

    ui.previewStatus =

        $("previewStatus");

    ui.previewNetwork =

        $("previewNetwork");

    // Review

    ui.reviewName =

        $("reviewName");

    ui.reviewSymbol =

        $("reviewSymbol");

    ui.reviewSupply =

        $("reviewSupply");

    ui.reviewDecimals =

        $("reviewDecimals");

    ui.reviewOwner =

        $("reviewOwner");

    ui.reviewNetwork =

        $("reviewNetwork");

    // Deploy

    ui.deployConsoleOutput =

        $("deployConsoleOutput");

    ui.contractAddress =

        $("contractAddress");

    ui.transactionHash =

        $("transactionHash");

    ui.blockNumber =

        $("blockNumber");

    // Loading

    ui.loadingOverlay =

        $("loadingOverlay");

    ui.loadingText =

        $("loadingText");

    // Toast

    ui.toastContainer =

        $("toastContainer");

    ui.toastTemplate =

        $("toastTemplate");

    // Modal

    ui.modal =

        $("modal");

    ui.modalTitle =

        $("modalTitle");

    ui.modalBody =

        $("modalBody");

    ui.modalConfirm =

        $("modalConfirm");

    ui.modalCancel =

        $("modalCancel");

    ui.modalClose =

        $("modalClose");

}

// =====================================================
// Getters
// =====================================================

export function getCurrentStep() {

    return state.currentStep;

}

export function getStepData(

    step

) {

    return STEP_DATA[

        step - 1

    ];

}

// =====================================================
// Wizard Engine
// =====================================================

export function showStep(

    step

) {

    if (

        step < 1 ||

        step > TOTAL_STEPS

    ) {

        return;

    }

    state.currentStep =

        step;

    refreshWizard();

    const wizardCard = document.getElementById("wizardCard");
    if (wizardCard) {
        wizardCard.scrollIntoView({ behavior: "smooth", block: "start" });
    }

}

export function nextStep() {

    if (

        state.currentStep <

        TOTAL_STEPS

    ) {

        showStep(

            state.currentStep + 1

        );

    }

}

export function previousStep() {

    if (

        state.currentStep > 1

    ) {

        showStep(

            state.currentStep - 1

        );

    }

}

export function goToStep(

    step

) {

    showStep(

        Number(step)

    );

}

// =====================================================
// Refresh Wizard
// =====================================================

export function refreshWizard() {

    refreshPages();

    refreshTimeline();

    refreshHeader();

    refreshNavigation();

}

// =====================================================
// Wizard Pages
// =====================================================

function refreshPages() {

    ui.wizardSteps.forEach(

        (

            page,

            index

        ) => {

            page.classList.toggle(

                "activeStep",

                index ===

                state.currentStep - 1

            );

        }

    );

}

// =====================================================
// Timeline
// =====================================================

function refreshTimeline() {

    ui.timelineSteps.forEach(

        (

            item,

            index

        ) => {

            item.classList.remove(

                "active",

                "completed"

            );

            if (

                index <

                state.currentStep - 1

            ) {

                item.classList.add(

                    "completed"

                );

            }

            if (

                index ===

                state.currentStep - 1

            ) {

                item.classList.add(

                    "active"

                );

            }

        }

    );

    if (

        ui.timelineProgress

    ) {

        const percent =

            (

                (

                    state.currentStep - 1

                )

                /

                (

                    TOTAL_STEPS - 1

                )

            ) * 100;

        ui.timelineProgress.style.setProperty(

            '--progress',

            `${percent}%`

        );

    }

}

// =====================================================
// Header
// =====================================================

function refreshHeader() {

    const step =

        getStepData(

            state.currentStep

        );

    if (

        ui.currentStepLabel

    ) {

        ui.currentStepLabel.textContent =

            `STEP ${state.currentStep} OF ${TOTAL_STEPS}`;

    }

    if (

        ui.wizardTitle

    ) {

        ui.wizardTitle.textContent =

            step.title;

    }

    if (

        ui.wizardDescription

    ) {

        ui.wizardDescription.textContent =

            step.description;

    }

}

// =====================================================
// Navigation
// =====================================================

function refreshNavigation() {

    if (

        ui.stepCounter

    ) {

        ui.stepCounter.textContent =

            `${state.currentStep} / ${TOTAL_STEPS}`;

    }

    if (

        ui.backButton

    ) {

        ui.backButton.disabled =

            state.currentStep === 1;

    }

    if (

        ui.nextButton

    ) {

        ui.nextButton.hidden =

            state.currentStep ===

            TOTAL_STEPS;

    }

    if (

        ui.deployButton

    ) {

        ui.deployButton.hidden =

            state.currentStep !==

            TOTAL_STEPS;

    }

}

// =====================================================
// Timeline Click
// =====================================================

export function bindTimeline() {

    ui.timelineSteps.forEach(

        item => {

            item.addEventListener(

                "click",

                () => {

                    goToStep(

                        Number(

                            item.dataset.step

                        )

                    );

                }

            );

        }

    );

}

// =====================================================
// Wallet
// =====================================================

export function shortenAddress(

    address

) {

    if (

        !address

    ) {

        return "-";

    }

    return (

        address.slice(

            0,

            6

        )

        +

        "..."

        +

        address.slice(

            -4

        )

    );

}

export function setWalletDisconnected() {

    if (

        ui.connectWalletButton

    ) {

        ui.connectWalletButton.innerHTML =

            `<i data-lucide="wallet"></i>
             <span>Connect Wallet</span>`;

    }

    ui.walletConnectionStatus &&
        (ui.walletConnectionStatus.textContent = "Disconnected");

    ui.walletProviderName &&
        (ui.walletProviderName.textContent = "-");

    ui.walletAddress &&
        (ui.walletAddress.textContent = "-");

    ui.walletNetwork &&
        (ui.walletNetwork.textContent = "-");

    ui.walletBalance &&
        (ui.walletBalance.textContent = "0");

    if (

        ui.walletBadge

    ) {

        ui.walletBadge.textContent =

            "Not Connected";

        ui.walletBadge.className =

            "badge disconnected";

    }

}

export function setWalletConnected({

    address,

    provider = "EVM Wallet",

    network = "-",

    balance = "0"

}) {

    if (

        ui.connectWalletButton

    ) {

        ui.connectWalletButton.innerHTML =

            `<i data-lucide="wallet"></i>
             <span>${shortenAddress(address)}</span>`;

    }

    ui.walletConnectionStatus &&
        (ui.walletConnectionStatus.textContent = "Connected");

    ui.walletProviderName &&
        (ui.walletProviderName.textContent = provider);

    ui.walletAddress &&
        (ui.walletAddress.textContent = address);

    ui.walletNetwork &&
        (ui.walletNetwork.textContent = network);

    ui.walletBalance &&
        (ui.walletBalance.textContent = balance);

    if (

        ui.walletBadge

    ) {

        ui.walletBadge.textContent =

            "Connected";

        ui.walletBadge.className =

            "badge success";

    }

    if (

        window.lucide

    ) {

        lucide.createIcons();

    }

}

// =====================================================
// Preview
// =====================================================

export function updatePreview(

    data = {}

) {

    const {

        name = "Token Name",

        symbol = "SYMBOL",

        owner = "-",

        supply = "-",

        decimals = 18,

        features = 0,

        fee = "Loading...",

        gas = "Loading...",

        health = "100%",

        network = "Loading...",

        status = "Ready"

    } = data;

    ui.previewName &&
        (ui.previewName.textContent = name);

    ui.previewSymbol &&
        (ui.previewSymbol.textContent = symbol);

    ui.previewOwner &&
        (ui.previewOwner.textContent = owner);

    ui.previewSupply &&
        (ui.previewSupply.textContent = supply);

    ui.previewDecimals &&
        (ui.previewDecimals.textContent = decimals);

    ui.previewFeatures &&
        (ui.previewFeatures.textContent =
            `${features} Enabled`);

    ui.previewFee &&
        (ui.previewFee.textContent = fee);

    ui.previewGas &&
        (ui.previewGas.textContent = gas);

    ui.previewHealth &&
        (ui.previewHealth.textContent = health);
    ui.previewStatus &&

        (ui.previewStatus.textContent = status);

    ui.previewNetwork &&

        (ui.previewNetwork.textContent = network);

}

// =====================================================
// Review
// =====================================================

export function updateReview(

    data = {}

) {

    ui.reviewName &&
        (ui.reviewName.textContent =
            data.name || "-");

    ui.reviewSymbol &&
        (ui.reviewSymbol.textContent =
            data.symbol || "-");

    ui.reviewSupply &&
        (ui.reviewSupply.textContent =
            data.supply || "-");

    ui.reviewDecimals &&
        (ui.reviewDecimals.textContent =
            data.decimals || 18);

    ui.reviewOwner &&
        (ui.reviewOwner.textContent =
            data.owner || "-");
    ui.reviewNetwork &&

        (ui.reviewNetwork.textContent =

            data.network || "Loading...");
}

// =====================================================
// Deploy Result
// =====================================================

export function updateDeployResult(

    result = {}

) {

    ui.contractAddress &&
        (ui.contractAddress.textContent =
            result.contractAddress || "-");

    ui.transactionHash &&
        (ui.transactionHash.textContent =
            result.transactionHash || "-");

    ui.blockNumber &&
        (ui.blockNumber.textContent =
            result.blockNumber || "-");

}

// =====================================================
// Deploy Console
// =====================================================

export function appendConsole(

    message

) {

    if (

        !ui.deployConsoleOutput

    ) {

        return;

    }

    ui.deployConsoleOutput.textContent +=

        `\n${message}`;

    ui.deployConsoleOutput.scrollTop =

        ui.deployConsoleOutput.scrollHeight;

}

// =====================================================
// Loading Overlay
// =====================================================

export function setLoading(isLoading, text = "Loading...") {

    if (ui.loadingText) {
        ui.loadingText.textContent = text;
    }

    if (ui.loadingOverlay) {
        ui.loadingOverlay.hidden = !isLoading;
    }

    state.loading = isLoading;
}

// =====================================================
// Deploy Timeline
// =====================================================

export function resetDeployUI() {
    const steps = $$("#deployTimeline .deployStep");
    steps.forEach(step => step.classList.remove("active", "completed", "error"));
    const consoleEl = ui.deployConsoleOutput;
    if (consoleEl) consoleEl.textContent = "Waiting...\n";
    const resultCard = document.getElementById("deployResult");
    if (resultCard) resultCard.hidden = true;
    if (ui.deployButton) ui.deployButton.hidden = false;
    if (ui.deployButton) ui.deployButton.disabled = false;
}

export function updateDeployTimeline(activeIndex, erroredIndex = -1) {

    const steps = $$("#deployTimeline .deployStep");

    steps.forEach((step, index) => {
        step.classList.remove("active", "completed", "error");

        if (erroredIndex !== -1 && index === erroredIndex) {
            step.classList.add("error");
        } else if (index < activeIndex) {
            step.classList.add("completed");
        } else if (index === activeIndex) {
            step.classList.add("active");
        }
    });
}

// =====================================================
// Modal
// =====================================================

export function openModal({

    title = "LaunchFuture",

    bodyHTML = "",

    showFooter = false,

    confirmText = "Confirm",

    onConfirm = null

} = {}) {

    if (ui.modalTitle) {
        ui.modalTitle.textContent = title;
    }

    if (ui.modalBody) {
        ui.modalBody.innerHTML = bodyHTML;
    }

    if (ui.modalFooter === undefined) {
        ui.modalFooter = $("modalFooter");
    }

    if (ui.modalFooter) {
        ui.modalFooter.hidden = !showFooter;
    }

    if (ui.modalConfirm) {
        ui.modalConfirm.textContent = confirmText;
        ui.modalConfirm.onclick = () => {
            if (typeof onConfirm === "function") onConfirm();
            closeModal();
        };
    }

    if (ui.modal) {
        ui.modal.hidden = false;
        document.body.classList.add("modalOpen");
    }

    state.modalOpen = true;

    if (window.lucide) {
        lucide.createIcons();
    }
}

export function closeModal() {

    if (ui.modal) {
        ui.modal.hidden = true;
        document.body.classList.remove("modalOpen");
    }

    state.modalOpen = false;
}

export function bindModal() {

    ui.modalClose?.addEventListener("click", closeModal);
    ui.modalCancel?.addEventListener("click", closeModal);

    const backdrop = $("modalBackdrop");
    backdrop?.addEventListener("click", closeModal);

    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && state.modalOpen) closeModal();
    });
}

// =====================================================
// Toast
// =====================================================

export function showToast({

    title = "",

    message = "",

    variant = "info"

} = {}) {

    if (!ui.toastContainer || !ui.toastTemplate) {

        console.warn(message || title);
        return;
    }

    const node = ui.toastTemplate.content.cloneNode(true);
    const toast = node.querySelector(".toast");

    if (toast) {
        toast.classList.add(`toast--${variant}`);
    }

    const titleEl = node.querySelector(".toastContent h4");
    const msgEl = node.querySelector(".toastContent p");

    if (titleEl) titleEl.textContent = title;
    if (msgEl) msgEl.textContent = message;

    const closeBtn = node.querySelector("[data-toast-close]");
    const el = ui.toastContainer.appendChild(node);
    const inserted = ui.toastContainer.lastElementChild;

    const remove = () => inserted?.remove();

    closeBtn?.addEventListener("click", remove);

    setTimeout(remove, 5000);
}

// =====================================================
// Theme (Dark / Light)
// =====================================================

const THEME_KEY = "launchfuture.theme";

export function getTheme() {

    return document.documentElement.getAttribute("data-theme") === "light"
        ? "light"
        : "dark";
}

function applyThemeIcon(theme) {

    const btn = $("themeButton");

    if (!btn) return;

    // Rebuild the icon element each time — lucide replaces <i data-lucide>
    // with an inline <svg>, so on repeat toggles there's no <i> left to
    // just update the attribute on.
    btn.innerHTML = `<i data-lucide="${theme === "light" ? "sun" : "moon"}"></i>`;

    if (window.lucide) {
        lucide.createIcons();
    }
}

export function setTheme(theme) {

    const resolved = theme === "light" ? "light" : "dark";

    document.documentElement.setAttribute("data-theme", resolved);
    localStorage.setItem(THEME_KEY, resolved);

    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) {
        meta.setAttribute(
            "content",
            resolved === "light" ? "#f3f4f7" : "#050505"
        );
    }

    applyThemeIcon(resolved);
}

export function toggleTheme() {

    setTheme(getTheme() === "light" ? "dark" : "light");
}

export function initTheme() {

    const saved = localStorage.getItem(THEME_KEY);

    if (saved === "light" || saved === "dark") {
        setTheme(saved);
        return;
    }

    const prefersLight =
        window.matchMedia &&
        window.matchMedia("(prefers-color-scheme: light)").matches;

    setTheme(prefersLight ? "light" : "dark");
}
