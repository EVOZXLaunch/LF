// =====================================================
// LaunchFuture
// Wizard Engine
// Part 1
// =====================================================

// =====================================================
// Constants
// =====================================================

export const TOTAL_STEPS =
    
    6;

const STORAGE_KEY =

    "launchfuture.wizard";

// =====================================================
// State
// =====================================================

let currentStep =

    1;
// =====================================================
// Wizard Data
// =====================================================

const wizardData = {

    token: {},

    features: {},

    metadata: {},

    payment: {}

};

// =====================================================
// Persistence
// =====================================================

export function saveWizard() {

    localStorage.setItem(

        STORAGE_KEY,

        JSON.stringify(

            wizardData

        )

    );

}

export function loadWizard() {

    const saved =

        localStorage.getItem(

            STORAGE_KEY

        );

    if (

        !saved

    ) {

        return false;

    }

    try {

        const data =

            JSON.parse(

                saved

            );

        wizardData.token =

            data.token ?? {};

        wizardData.features =

            data.features ?? {};

        wizardData.metadata =

            data.metadata ?? {};

        wizardData.payment =

            data.payment ?? {};

      return true;

    }

    catch (

        error

    ) {

        console.error(

            error

        );

      return false;

    }

}

export function resetWizard() {

    currentStep = 1;

    wizardData.token = {};

    wizardData.features = {};

    wizardData.metadata = {};

    wizardData.payment = {};

    localStorage.removeItem(

        STORAGE_KEY

    );

}

// =====================================================
// Getters
// =====================================================

export function getCurrentStep() {

    return currentStep;

}

export function getTotalSteps() {

    return TOTAL_STEPS;

}

export function getWizardData() {

    return structuredClone(

        wizardData

    );

}

// =====================================================
// Navigation
// =====================================================

export function nextStep() {

    if (

        currentStep <

        TOTAL_STEPS

    ) {

        currentStep++;

    }

    return currentStep;

}

export function previousStep() {

    if (

        currentStep >

        1

    ) {

        currentStep--;

    }

    return currentStep;

}

export function goToStep(
    step
) {

    if (

        step < 1 ||

        step >

        TOTAL_STEPS

    ) {

        throw new Error(

            "Invalid wizard step."

        );

    }

    currentStep =

        step;

    return currentStep;

}

// =====================================================
// Progress
// =====================================================

export function getProgress() {

    return Math.round(

        (

            currentStep /

            TOTAL_STEPS

        ) * 100

    );

}

export function isFirstStep() {

    return (

        currentStep ===

        1

    );

}

export function isLastStep() {

    return (

        currentStep ===

        TOTAL_STEPS

    );

}

// =====================================================
// Data
// =====================================================

export function setTokenData(
    data
) {

    wizardData.token = {

        ...wizardData.token,

        ...data

    };

    saveWizard();

}

export function setFeatureData(
    data
) {

    wizardData.features = {

        ...wizardData.features,

        ...data

    };

  saveWizard();

}

export function setMetadataData(
    data
) {

    wizardData.metadata = {

        ...wizardData.metadata,

        ...data

    };

  saveWizard();

}

export function setPaymentData(
    data
) {

    wizardData.payment = {

        ...wizardData.payment,

        ...data

    };

  saveWizard();

}

// =====================================================
// Helpers
// =====================================================

export function hasWizardData() {

    return (

        Object.keys(

            wizardData.token

        ).length > 0 ||

        Object.keys(

            wizardData.features

        ).length > 0 ||

        Object.keys(

            wizardData.metadata

        ).length > 0 ||

        Object.keys(

            wizardData.payment

        ).length > 0

    );

}

export function isWizardEmpty() {

    return !

        hasWizardData();

}
