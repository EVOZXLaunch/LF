// =====================================================
// LaunchFuture
// Feature Registry — matches the LFTFactory TokenConfig struct
// =====================================================

// Each entry:
//   id:         DOM element id (prefixed with "feature" for booleans)
//   label:      Human-readable label
//   category:   Grouping category
//   type:       "boolean" | "number" | "percentage" | "address" | "seconds"
//   dependsOn:  (optional) if set, only active when parent feature is enabled
//   defaultValue: fallback when the input is empty or hidden

const FEATURES = [

    // =================================================
    // Core
    // =================================================

    {
        id: "featureMintable",
        label: "Mintable",
        category: "core",
        type: "boolean",
        defaultValue: false
    },

    {
        id: "featureBurnable",
        label: "Burnable",
        category: "core",
        type: "boolean",
        defaultValue: false
    },

    // =================================================
    // Trading
    // =================================================

    {
        id: "featureTrading",
        label: "Trading Enable",
        category: "trading",
        type: "boolean",
        defaultValue: false
    },

    {
        id: "featureTradingDelay",
        label: "Trading Delay",
        category: "trading",
        type: "boolean",
        defaultValue: false
    },

    {
        id: "featureTradingDelaySeconds",
        label: "Trading Delay (seconds)",
        category: "trading",
        type: "seconds",
        dependsOn: "featureTradingDelay",
        defaultValue: 30
    },

    // =================================================
    // Security
    // =================================================

    {
        id: "featureAntiBot",
        label: "Anti Bot",
        category: "security",
        type: "boolean",
        defaultValue: false
    },

    {
        id: "featureAntiBotBlocks",
        label: "Anti Bot Blocks",
        category: "security",
        type: "number",
        dependsOn: "featureAntiBot",
        defaultValue: 3
    },

    {
        id: "featureBlacklist",
        label: "Blacklist",
        category: "security",
        type: "boolean",
        defaultValue: false
    },

    {
        id: "featureWhitelist",
        label: "Whitelist",
        category: "security",
        type: "boolean",
        defaultValue: false
    },

    {
        id: "featureCooldown",
        label: "Cooldown",
        category: "security",
        type: "boolean",
        defaultValue: false
    },

    {
        id: "featureCooldownSeconds",
        label: "Cooldown (seconds)",
        category: "security",
        type: "seconds",
        dependsOn: "featureCooldown",
        defaultValue: 30
    },

    // =================================================
    // Limits
    // =================================================

    {
        id: "featureMaxWallet",
        label: "Max Wallet",
        category: "limits",
        type: "boolean",
        defaultValue: false
    },

    {
        id: "featureMaxWalletPercent",
        label: "Max Wallet (%)",
        category: "limits",
        type: "percentage",
        dependsOn: "featureMaxWallet",
        defaultValue: 200
    },

    {
        id: "featureMaxTx",
        label: "Max Transaction",
        category: "limits",
        type: "boolean",
        defaultValue: false
    },

    {
        id: "featureMaxTxPercent",
        label: "Max Transaction (%)",
        category: "limits",
        type: "percentage",
        dependsOn: "featureMaxTx",
        defaultValue: 100
    },

    // =================================================
    // Tax
    // =================================================

    {
        id: "featureBuyTaxEnabled",
        label: "Enable Buy Tax",
        category: "tax",
        type: "boolean",
        defaultValue: false
    },

    {
        id: "featureBuyTax",
        label: "Buy Tax (%)",
        category: "tax",
        type: "percentage",
        dependsOn: "featureBuyTaxEnabled",
        defaultValue: 0
    },

    {
        id: "featureSellTaxEnabled",
        label: "Enable Sell Tax",
        category: "tax",
        type: "boolean",
        defaultValue: false
    },

    {
        id: "featureSellTax",
        label: "Sell Tax (%)",
        category: "tax",
        type: "percentage",
        dependsOn: "featureSellTaxEnabled",
        defaultValue: 0
    },

    {
        id: "featureTransferTaxEnabled",
        label: "Enable Transfer Tax",
        category: "tax",
        type: "boolean",
        defaultValue: false
    },

    {
        id: "featureTransferTax",
        label: "Transfer Tax (%)",
        category: "tax",
        type: "percentage",
        dependsOn: "featureTransferTaxEnabled",
        defaultValue: 0
    },

    {
        id: "featureBurnShare",
        label: "Burn Share (%)",
        category: "tax",
        type: "percentage",
        defaultValue: 0
    },

    {
        id: "featureMarketingShare",
        label: "Marketing Share (%)",
        category: "tax",
        type: "percentage",
        defaultValue: 0
    },

    {
        id: "featureMarketingWallet",
        label: "Marketing Wallet",
        category: "tax",
        type: "address",
        defaultValue: ""
    },

    {
        id: "featureDevelopmentShare",
        label: "Development Share (%)",
        category: "tax",
        type: "percentage",
        defaultValue: 0
    },

    {
        id: "featureDevelopmentWallet",
        label: "Development Wallet",
        category: "tax",
        type: "address",
        defaultValue: ""
    },

    {
        id: "featureTreasuryShare",
        label: "Treasury Share (%)",
        category: "tax",
        type: "percentage",
        defaultValue: 0
    },

    {
        id: "featureTreasuryWallet",
        label: "Treasury Wallet",
        category: "tax",
        type: "address",
        defaultValue: ""
    },

    {
        id: "featureLiquidityShare",
        label: "Liquidity Share (%)",
        category: "tax",
        type: "percentage",
        defaultValue: 0
    },

    {
        id: "featureLiquidityWallet",
        label: "Liquidity Wallet",
        category: "tax",
        type: "address",
        defaultValue: ""
    },

    {
        id: "featureBuybackShare",
        label: "Buyback Share (%)",
        category: "tax",
        type: "percentage",
        defaultValue: 0
    },

    {
        id: "featureBuybackWallet",
        label: "Buyback Wallet",
        category: "tax",
        type: "address",
        defaultValue: ""
    },

    {
        id: "featureCharityShare",
        label: "Charity Share (%)",
        category: "tax",
        type: "percentage",
        defaultValue: 0
    },

    {
        id: "featureCharityWallet",
        label: "Charity Wallet",
        category: "tax",
        type: "address",
        defaultValue: ""
    },

    {
        id: "featureTaxLocked",
        label: "Tax Lock",
        category: "tax",
        type: "boolean",
        defaultValue: false
    },

    // =================================================
    // Recovery
    // =================================================

    {
        id: "featureRecoverERC20",
        label: "Recover ERC20",
        category: "recovery",
        type: "boolean",
        defaultValue: false
    },

    {
        id: "featureRecoverNative",
        label: "Recover Native Coin",
        category: "recovery",
        type: "boolean",
        defaultValue: false
    },

    // =================================================
    // Advanced
    // =================================================

    {
        id: "featurePermit",
        label: "ERC20 Permit",
        category: "advanced",
        type: "boolean",
        defaultValue: false
    },

    {
        id: "featurePausable",
        label: "Pausable",
        category: "advanced",
        type: "boolean",
        defaultValue: false
    },

    {
        id: "featureVotes",
        label: "Votes (ERC20Votes)",
        category: "advanced",
        type: "boolean",
        defaultValue: false
    },

    {
        id: "featureSnapshot",
        label: "Snapshot",
        category: "advanced",
        type: "boolean",
        defaultValue: false
    },

    {
        id: "featureRenounceOwnership",
        label: "Renounce Ownership",
        category: "advanced",
        type: "boolean",
        defaultValue: false
    }

];

export default FEATURES;
