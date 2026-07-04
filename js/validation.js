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

  MAX_PERCENT:10,

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

    return "Percentage must be between 1 and 10.";
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

  if(

    !config.buyTaxEnabled &&

    !config.sellTaxEnabled

  ){

    return "";

  }

  const burn=

    Number(config.burnTaxShare);

  const marketing=

    text(config.marketingWallet);

  const development=

    text(config.developmentWallet);

  if(

    burn>0 ||

    marketing ||

    development

  ){

    return "";

  }

  return "Buy Tax or Sell Tax requires Burn Share or Marketing Wallet or Development Wallet.";

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

    (error=validateTaxReceivers(

      config

    ))

  ){

    return error;

  }

  return "";

    }
