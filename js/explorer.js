import {
    getAllTokens
} from "./factory.js";

import {
    initializeWallet
} from "./wallet.js";

import {
    Contract,
    JsonRpcProvider
} from "https://esm.sh/ethers@6";

import {
    NETWORK,
    ABI,
    explorerToken
} from "./config.js";

// =====================================================
// STATE
// =====================================================

let allTokens = [];

let filteredTokens = [];

let currentPage = 1;

let currentSort =
    "newest";

const PAGE_SIZE = 20;

// =====================================================
// HELPERS
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

function formatSupply(
    value
) {

    try {

        return Number(
            value / 1000000000000000000n
        ).toLocaleString();

    }

    catch {

        return String(
            value
        );

    }

}

// =====================================================
// RENDER STATISTICS
// =====================================================

function renderStats() {

    const statsBar =
        document.getElementById(
            "statsBar"
        );

    if (!statsBar) {

        return;

    }

    const totalTokens =
        allTokens.length;

    const totalCreators =
        new Set(

            allTokens.map(
                token =>
                    token.creator
            )

        ).size;

    const today =
        new Date()
            .toDateString();

    const createdToday =

        allTokens.filter(
            token => {

                const date =

                    new Date(

                        Number(
                            token.createdAt
                        ) * 1000

                    );

                return (

                    date.toDateString() ===
                    today

                );

            }
        ).length;

    const latestToken =

        [...allTokens]

            .sort(

                (a, b) =>

                    Number(
                        b.createdAt
                    ) -

                    Number(
                        a.createdAt
                    )

            )[0];

    statsBar.innerHTML = `

        <div class="stat-card">

            <div class="stat-label">

                Total Tokens

            </div>

            <div class="stat-value">

                ${totalTokens}

            </div>

        </div>

        <div class="stat-card">

            <div class="stat-label">

                Creators

            </div>

            <div class="stat-value">

                ${totalCreators}

            </div>

        </div>

        <div class="stat-card">

            <div class="stat-label">

                Created Today

            </div>

            <div class="stat-value">

                ${createdToday}

            </div>

        </div>

        <div class="stat-card">

            <div class="stat-label">

                Latest Token

            </div>

            <div class="stat-value">

                ${latestToken?.symbol ?? "-"}

            </div>

        </div>

    `;

}

// =====================================================
// TOKEN CARD
// =====================================================

function createTokenCard(token) {

    const template =

        document.getElementById(
            "tokenCardTemplate"
        );

    const fragment =

        template.content.cloneNode(
            true
        );

    fragment
        .querySelector(
            ".token-name"
        )
        .textContent =
        token.name;

    fragment
        .querySelector(
            ".token-symbol"
        )
        .textContent =
        token.symbol;

    const logo =

    fragment.querySelector(
        ".token-logo"
    );

if (
    logo &&
    token.logoURI
) {

    logo.src =
        token.logoURI;

}

    fragment
        .querySelector(
            ".token-address"
        )
        .textContent =
        shortAddress(
            token.address
        );

    fragment
        .querySelector(
            ".token-supply"
        )
        .textContent =
        formatSupply(
            token.supply
        );

    fragment
        .querySelector(
            ".token-creator"
        )
        .textContent =
        shortAddress(
            token.creator
        );

    fragment
        .querySelector(
            ".token-created"
        )
        .textContent =
        new Date(

            Number(
                token.createdAt
            ) * 1000

        ).toLocaleDateString();

    const copyButton =

        fragment.querySelector(
            ".token-copy"
        );

    copyButton.onclick =
        async () => {

            try {

                await navigator
                    .clipboard
                    .writeText(
                        token.address
                    );

            }

            catch (error) {

                console.error(
                    error
                );

            }

        };

    const explorerButton =

        fragment.querySelector(
            ".token-explorer"
        );

    explorerButton.onclick =
        () => {

            window.open(

                explorerToken(
                    token.address
                ),

                "_blank"

            );

        };

    const detailsButton =

        fragment.querySelector(
            ".token-details"
        );

    detailsButton.onclick =
        () => {

            location.href =

                `./token.html?address=${token.address}`;

        };

    return fragment;

}

// =====================================================
// SORT TOKENS
// =====================================================

function sortTokens(
    tokens,
    mode
) {

    const result =
        [...tokens];

    switch (mode) {

        case "newest":

            result.sort(

                (a, b) =>

                    Number(
                        b.createdAt
                    ) -

                    Number(
                        a.createdAt
                    )

            );

            break;

        case "oldest":

            result.sort(

                (a, b) =>

                    Number(
                        a.createdAt
                    ) -

                    Number(
                        b.createdAt
                    )

            );

            break;

        case "az":

            result.sort(

                (a, b) =>

                    a.name.localeCompare(
                        b.name
                    )

            );

            break;

        case "za":

            result.sort(

                (a, b) =>

                    b.name.localeCompare(
                        a.name
                    )

            );

            break;

    }

    return result;

}

// =====================================================
// APPLY FILTERS
// =====================================================

function applyFilters() {

    const searchInput =

        document.getElementById(
            "tokenSearch"
        );

    const keyword =

        searchInput
            ?.value
            .trim()
            .toLowerCase()

        ?? "";

    let tokens =
        [...allTokens];

    if (keyword) {

        tokens =

            tokens.filter(

                token =>

                    token.name
                        .toLowerCase()
                        .includes(
                            keyword
                        )

                    ||

                    token.symbol
                        .toLowerCase()
                        .includes(
                            keyword
                        )

                    ||

                    token.address
                        .toLowerCase()
                        .includes(
                            keyword
                        )

            );

    }

    tokens =

        sortTokens(

            tokens,

            currentSort

        );

    filteredTokens =
        tokens;

    currentPage = 1;

    renderTokens(
        filteredTokens
    );

}

// =====================================================
// RENDER
// =====================================================

function renderTokens(tokens) {

    const container =

        document.getElementById(
            "tokenList"
        );

    const info =

        document.getElementById(
            "paginationInfo"
        );

    if (!container) {

        return;

    }

    container.innerHTML = "";

    const start =

        (currentPage - 1) *
        PAGE_SIZE;

    const end =

        start +
        PAGE_SIZE;

    const pageTokens =

        tokens.slice(
            start,
            end
        );

    for (const token of pageTokens) {

        container.appendChild(

            createTokenCard(
                token
            )

        );

    }

    if (info) {

        info.textContent =

            `Showing ${pageTokens.length ? start + 1 : 0}-${Math.min(end, tokens.length)} of ${tokens.length} tokens`;

    }

    renderPagination(
        tokens
    );

}

function renderPagination(tokens) {

    const pagination =

        document.getElementById(
            "pagination"
        );

    if (!pagination) {

        return;

    }

    pagination.innerHTML = "";

    const totalPages =

        Math.ceil(
            tokens.length /
            PAGE_SIZE
        );

    if (totalPages <= 1) {

        return;

    }

    const prev =

        document.createElement(
            "button"
        );

    prev.className =
        "secondary-button";

    prev.textContent =
        "Previous";

    prev.disabled =
        currentPage === 1;

    prev.onclick =
        () => {

            currentPage--;

            renderTokens(
                tokens
            );

        };

    pagination.appendChild(
        prev
    );

    const maxButtons = 7;

    let startPage =

        Math.max(
            1,
            currentPage - 3
        );

    let endPage =

        Math.min(
            totalPages,
            startPage + maxButtons - 1
        );

    if (
        endPage -
        startPage <
        maxButtons - 1
    ) {

        startPage =

            Math.max(
                1,
                endPage -
                maxButtons +
                1
            );

    }

    for (
        let page = startPage;
        page <= endPage;
        page++
    ) {

        const button =

            document.createElement(
                "button"
            );

        button.textContent =
            page;

        button.className =

            page === currentPage

                ? "primary-button"

                : "secondary-button";

        button.onclick =
            () => {

                currentPage =
                    page;

                renderTokens(
                    tokens
                );

            };

        pagination.appendChild(
            button
        );

    }

    const next =

        document.createElement(
            "button"
        );

    next.className =
        "secondary-button";

    next.textContent =
        "Next";

    next.disabled =
        currentPage === totalPages;

    next.onclick =
        () => {

            currentPage++;

            renderTokens(
                tokens
            );

        };

    pagination.appendChild(
        next
    );

}

// =====================================================
// LOAD
// =====================================================

let tokenAbi = null;

async function loadTokenAbi() {

    if (tokenAbi) {

        return tokenAbi;

    }

    const response =
        await fetch(
            ABI.token
        );

    tokenAbi =
        await response.json();

    return tokenAbi;

}

async function getLogoURI(
    address
) {

    try {

        const contract =
            new Contract(

                address,

                await loadTokenAbi(),

                new JsonRpcProvider(
                    NETWORK.rpcUrl
                )

            );

        return await contract.logoURI();

    }

    catch {

        return "./images/logo.png";

    }

}

async function getTotalSupply(
    address
) {

    try {

        const contract =
            new Contract(

                address,

                await loadTokenAbi(),

                new JsonRpcProvider(
                    NETWORK.rpcUrl
                )

            );

        return await contract.totalSupply();

    }

    catch {

        return 0n;

    }

}

async function loadExplorer() {

    const loading =

        document.getElementById(
            "loadingState"
        );

    try {

        const tokens =

            await getAllTokens();

        console.log(
            "FACTORY TOKENS:",
            tokens
        );

        allTokens = [];

        for (const item of tokens) {

            const currentSupply =
    await getTotalSupply(
        item[0]
    );

allTokens.push({

    address:
        item[0],

    creator:
        item[1],

    name:
        item[2],

    symbol:
        item[3],

    supply:
        currentSupply,

    createdAt:
        item[5],

    chainId:
        NETWORK.chainId,

    active:
        true,

    logoURI:
        await getLogoURI(
            item[0]
        )

});

        }

        renderStats();

        filteredTokens =
            [...allTokens];

        applyFilters();

    }

    catch (error) {

        console.error(
            "EXPLORER ERROR:",
            error
        );

    }

    finally {

        if (loading) {

            loading.hidden =
                true;

        }

    }

}

// =====================================================
// SEARCH
// =====================================================

function setupSearch() {

    const input =

        document.getElementById(
            "tokenSearch"
        );

    if (!input) {

        return;

    }

    input.addEventListener(

        "input",

        () => {

            applyFilters();

        }

    );

}

// =====================================================
// SORT BUTTONS
// =====================================================

function setupSort() {

    const buttons =

        document.querySelectorAll(
            ".sort-btn"
        );

    if (!buttons.length) {

        return;

    }

    buttons.forEach(

        button => {

            button.addEventListener(

                "click",

                () => {

                    buttons.forEach(

                        item =>

                            item.classList.remove(
                                "active"
                            )

                    );

                    button.classList.add(
                        "active"
                    );

                    currentSort =
                        button.dataset.sort;

                    applyFilters();

                }

            );

        }

    );

}

// =====================================================
// STARTUP
// =====================================================

document.addEventListener(

    "DOMContentLoaded",

    async () => {

        await initializeWallet();

        await loadExplorer();

        setupSearch();

        setupSort();

    }

);
