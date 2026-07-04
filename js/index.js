import {
    connectWallet,
    initializeWallet,
    getAccount,
    shortAddress
} from "./wallet.js";

import{

  getFactoryName,

  getVersion,

  getTotalTokens,

  getOwner,

  getAllTokens

}from"./factory.js";

import {

  getLftPerNative

} from "./exchange.js";

import{

  NETWORK

}from"./config.js";

// =====================================================
// ELEMENTS
// =====================================================

const connectButton=

document.getElementById(

  "connectWallet"

);

const factoryNameElement=

document.getElementById(

  "factoryName"

);

const versionElement=

document.getElementById(

  "factoryVersion"

);

const totalTokensElement=

document.getElementById(

  "totalTokens"

);

const ownerElement=

document.getElementById(

  "factoryOwner"

);

const latestTokensElement=

document.getElementById(

  "latestTokens"

);

const exchangeRateElement=

document.getElementById(

  "exchangeRate"

);

// =====================================================
// WALLET UI
// =====================================================

function updateWalletButton(){

  if(!connectButton){

    return;

  }

  const account=

    getAccount();

  connectButton.textContent=

    account

      ? shortAddress(account)

      : "Connect Wallet";

}

// =====================================================
// FACTORY INFO
// =====================================================

async function loadFactoryInfo(){

  try{

    const[

      factoryName,

      version,

      totalTokens,

      owner

    ]=await Promise.all([

      getFactoryName(),

      getVersion(),

      getTotalTokens(),

      getOwner()

    ]);

    if(factoryNameElement){

      factoryNameElement.textContent=

        factoryName;

    }

    if(versionElement){

      versionElement.textContent=

        version;

    }

    if(totalTokensElement){

      totalTokensElement.textContent=

        totalTokens.toLocaleString();

    }

    if(ownerElement){

      ownerElement.textContent=

        shortAddress(owner);

    }

    if(exchangeRateElement){

      try {

        const rate =
          await getLftPerNative();

        exchangeRateElement.textContent =

          rate > 0n
            ? `1 ${NETWORK.contracts?.utilitySymbol || "LFT"} = ${
                (1e18 / Number(rate)).toLocaleString(undefined, { maximumFractionDigits: 6 })
              } ${NETWORK.symbol}`
            : "Exchange not available";

      }

      catch {

        exchangeRateElement.textContent =
          "Exchange not available";

      }

    }

  }

  catch(error){

    console.error(error);

  }

}

async function loadLatestTokens(){

  if(

    !latestTokensElement

  ){

    return;

  }

  try{

    const tokens=

      await getAllTokens();

    const latest =

  Array.isArray(tokens)

    ? [...tokens]
        .sort(
          (a, b) =>
            Number(b[5]) -
            Number(a[5])
        )
        .slice(0, 6)

    : [];

    latestTokensElement.innerHTML="";

      if(latest.length===0){

  latestTokensElement.innerHTML=`

    <div class="feature-card">

      <h3>
        No Tokens Yet
      </h3>

      <p>
        Be the first creator on LaunchFuture.
      </p>

    </div>

  `;

  return;

      }

    for(

      const token

      of latest

    ){

      const card=

        document.createElement(

          "article"

        );

      card.className=

        "feature-card";

      card.innerHTML=`

        <h3>

          ${token[2]}

        </h3>

        <p>

          ${token[3]}

        </p>

        <a
          href="./token.html?address=${token[0]}">

          View Token

        </a>

      `;

      latestTokensElement.appendChild(

        card

      );

    }

  }

  catch(error){

    console.error(

      error

    );

  }

}

// =====================================================
// CONNECT WALLET
// =====================================================

async function connect(){

  try{

    await connectWallet();

    updateWalletButton();

  }

  catch(error){

    console.error(error);

  }

}

// =====================================================
// INITIALIZATION
// =====================================================

async function initialize(){

await initializeWallet();

updateWalletButton();

await loadFactoryInfo();

await loadLatestTokens();
if(connectButton){

connectButton.addEventListener(  

  "click",  

  connect  

);

}

}

// =====================================================
// PAGE LOAD
// =====================================================

document.addEventListener(

  "DOMContentLoaded",

  initialize

);
