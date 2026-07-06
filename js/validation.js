import {

  isAddress

} from "https://esm.sh/ethers@6";

import {

  symbolExists

} from "./factory.js";

export const LIMITS={

  MIN_NAME_LENGTH:2,

  MIN_SYMBOL_LENGTH:2,

  MAX_SYMBOL_LENGTH:12,

  MIN_SUPPLY:1,

  MAX_SUPPLY:1_000_000_000_000,

  MAX_TAX:10,

  MIN_PERCENT:1,

  // Contract only requires >0 when enabled — no upper cap
  // besides 100% of supply (ERC20MaxTransferLib divides by 100).
  MAX_PERCENT:100,

  MAX_URL_LENGTH:300,

  MAX_LOGO_LENGTH:500

};

const text=(value)=>

  String(value ?? "").trim();

export const required=(value)=>

  text(value).length>0;

// =====================================================
// NAME
// =====================================================

export function validateName(name){

  name=text(name);

  if(!name){

    return "Token name is required.";

  }

  if(name.length<LIMITS.MIN_NAME_LENGTH){

    return "Token name must contain at least 2 characters.";

  }

  return "";

}

// =====================================================
// SYMBOL
// =====================================================

export function validateSymbol(symbol){

  symbol=text(symbol).toUpperCase();

  if(!symbol){

    return "Token symbol is required.";

  }

  if(symbol.length<LIMITS.MIN_SYMBOL_LENGTH){

    return "Token symbol must contain at least 2 characters.";

  }

  if(symbol.length>LIMITS.MAX_SYMBOL_LENGTH){

    return "Maximum symbol length is 12.";

  }

  return "";

}

export async function checkSymbol(symbol){

  symbol=text(symbol).toUpperCase();

  const error=

    validateSymbol(symbol);

  if(error){

    return{

      valid:false,

      exists:false,

      message:error

    };

  }

  const exists=

    await symbolExists(symbol);

  return{

    valid:!exists,

    exists,

    message:exists

      ? "Symbol already exists."

      : ""

  };

}

// =====================================================
// SUPPLY
// =====================================================

export function validateSupply(value){

  const supply=Number(value);

  if(!Number.isFinite(supply)){

    return "Invalid supply.";

  }

  if(supply<LIMITS.MIN_SUPPLY){

    return "Supply must be greater than zero.";

  }

  if(supply>LIMITS.MAX_SUPPLY){

    return "Maximum supply is 1 trillion.";

  }

  return "";

}

// =====================================================
// MAX SUPPLY
// =====================================================

export function validateMaxSupply(maxSupply, supply){

  maxSupply=Number(maxSupply);

  if(!maxSupply){

    // Optional — blank means "default to Total Supply".
    return "";

  }

  if(!Number.isFinite(maxSupply) || maxSupply<=0){

    return "Invalid max supply.";

  }

  if(maxSupply<Number(supply)){

    return "Max Supply must be greater than or equal to Total Supply.";

  }

  if(maxSupply>LIMITS.MAX_SUPPLY){

    return "Maximum supply is 1 trillion.";

  }

  return "";

}

// =====================================================
// POSITIVE-WHEN-ENABLED (Anti-Bot Blocks / Trading Delay Seconds)
// =====================================================

export function validatePositiveWhenEnabled(enabled, value, label){

  if(!enabled){

    return "";

  }

  value=Number(value);

  if(!Number.isFinite(value) || value<=0){

    return `${label} must be greater than 0 when enabled.`;

  }

  return "";

}

// =====================================================
// TAX
// =====================================================

export function validateTax(value){

  value=Number(value);

  if(Number.isNaN(value)){

    return "Invalid tax.";

  }

  if(

    value<0 ||

    value>LIMITS.MAX_TAX

  ){

    return "Tax must be between 0% and 10%.";

  }

  return "";

}

// =====================================================
// PERCENT
// =====================================================

export function validatePercent(value){

  value=Number(value);

  if(Number.isNaN(value)){

    return "Invalid percentage.";

  }

  if(

    value<LIMITS.MIN_PERCENT ||

    value>LIMITS.MAX_PERCENT

  ){

    return `Percentage must be between ${LIMITS.MIN_PERCENT} and ${LIMITS.MAX_PERCENT}.`;
  }

  return "";

}

// =====================================================
// URL
// =====================================================

export function validateURL(

  url,

  maxLength=LIMITS.MAX_URL_LENGTH

){

  url=text(url);

  if(!url){

    return "";

  }

  if(url.length>maxLength){

    return `Maximum URL length is ${maxLength} characters.`;

  }

  try{

    new URL(url);

    return "";

  }

  catch{

    return "Invalid URL.";

  }

}

// =====================================================
// ADDRESS
// =====================================================

export function validateAddress(address){

  address=text(address);

  if(!address){

    return "";

  }

  return isAddress(address)

    ? ""

    : "Invalid wallet address.";

}

// =====================================================
// TAX RECEIVERS
// =====================================================

export function validateTaxReceivers(config){

  const anyTaxEnabled=

    config.buyTaxEnabled ||

    config.sellTaxEnabled ||

    config.transferTaxEnabled;

  const shares={

    burn: Number(config.burnTaxShare)||0,

    marketing: Number(config.marketingTaxShare)||0,

    development: Number(config.developmentTaxShare)||0,

    treasury: Number(config.treasuryTaxShare)||0,

    liquidity: Number(config.liquidityTaxShare)||0,

    buyback: Number(config.buybackTaxShare)||0,

    charity: Number(config.charityTaxShare)||0

  };

  const total=

    Object.values(shares)

      .reduce((sum,v)=>sum+v,0);

  // If nothing is configured at all, the app defaults
  // everything to 100% burn — always valid, skip the check.
  if(total===0){

    return "";

  }

  if(total!==100){

    return `Tax shares must add up to exactly 100% (currently ${total}%).`;

  }

  const walletFor={

    marketing:"marketingWallet",

    development:"developmentWallet",

    treasury:"treasuryWallet",

    liquidity:"liquidityWallet",

    buyback:"buybackWallet",

    charity:"charityWallet"

  };

  const labelFor={

    marketing:"Marketing",

    development:"Development",

    treasury:"Treasury",

    liquidity:"Liquidity",

    buyback:"Buyback",

    charity:"Charity"

  };

  for(const key of Object.keys(walletFor)){

    if(shares[key]>0){

      const wallet=

        text(config[walletFor[key]]);

      if(!wallet){

        return `${labelFor[key]} Share is set but ${labelFor[key]} Wallet is empty.`;

      }

      if(validateAddress(wallet)){

        return `${labelFor[key]} Wallet is not a valid address.`;

      }

    }

  }

  if(anyTaxEnabled && total!==100){

    return "Buy/Sell/Transfer Tax requires the tax shares above to add up to 100%.";

  }

  return "";

}

// =====================================================
// CONFIG VALIDATION
// =====================================================

export function validateConfig(config){

  let error;

  if(

    (error=validateName(config.name))

  ){

    return error;

  }

  if(

    (error=validateSymbol(config.symbol))

  ){

    return error;

  }

  if(

    (error=validateSupply(config.supply))

  ){

    return error;

  }

  if(

    (error=validateMaxSupply(config.maxSupply, config.supply))

  ){

    return error;

  }

  if(

    config.buyTaxEnabled &&

    (error=validateTax(config.buyTax))

  ){

    return error;

  }

  if(

    config.sellTaxEnabled &&

    (error=validateTax(config.sellTax))

  ){

    return error;

  }

  if(

    config.transferTaxEnabled &&

    (error=validateTax(config.transferTax))

  ){

    return error;

  }

  if(

    (error=validatePositiveWhenEnabled(

      config.antiBot,

      config.antiBotBlocks,

      "Anti-Bot Blocks"

    ))

  ){

    return error;

  }

  if(

    (error=validatePositiveWhenEnabled(

      config.tradingDelay,

      config.tradingDelaySeconds,

      "Trading Delay Seconds"

    ))

  ){

    return error;

  }

  if(

    config.maxWalletEnabled &&

    (error=validatePercent(

      config.maxWalletPercent

    ))

  ){

    return error;

  }

  if(

    config.maxTxEnabled &&

    (error=validatePercent(

      config.maxTxPercent

    ))

  ){

    return error;

  }

  if(

    (error=validateURL(

      config.website

    ))

  ){

    return error;

  }

  if(

    (error=validateURL(

      config.telegram

    ))

  ){

    return error;

  }

  if(

    (error=validateURL(

      config.twitter

    ))

  ){

    return error;

  }

  if(

    (error=validateURL(

      config.logoURI,

      LIMITS.MAX_LOGO_LENGTH

    ))

  ){

    return error;

  }

  if(

    (error=validateAddress(

      config.marketingWallet

    ))

  ){

    return error;

  }

  if(

    (error=validateAddress(

      config.developmentWallet

    ))

  ){

    return error;

  }

  if(

    (error=validateAddress(

      config.treasuryWallet

    ))

  ){

    return error;

  }

  if(

    (error=validateAddress(

      config.liquidityWallet

    ))

  ){

    return error;

  }

  if(

    (error=validateAddress(

      config.buybackWallet

    ))

  ){

    return error;

  }

  if(

    (error=validateAddress(

      config.charityWallet

    ))

  ){

    return error;

  }

  if(

    (error=validateTaxReceivers(

      config

    ))

  ){

    return error;

  }

  return "";

    }
