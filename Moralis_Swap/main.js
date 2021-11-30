/** Connect to Moralis server */
//const serverUrl = "https://xxxxx.https://7hsy7rsheuap.usemoralis.com:2053/server.com:2053/server";
//const appId = "9UiIvd64MnZbcaadhwkJOT3Aq5I37sTK9iL1vUQx";
//Moralis.start({ serverUrl, appId });
Moralis.initialize("9UiIvd64MnZbcaadhwkJOT3Aq5I37sTK9iL1vUQx");
Moralis.serverURL = ("https://7hsy7rsheuap.usemoralis.com:2053/server");

let currentTrade = {};
let currentSelectSide;
let tokens;

async function init(){
    await Moralis.initPlugins();
    await Moralis.enable();
    await listAvailableTokens();
    currentUser = Moralis.User.current();
    if(currentUser){
      currentUser = await Moralis.Web3.authenticate();
    }
}

async function listAvailableTokens(){
  const result = await Moralis.Plugins.oneInch.getSupportedTokens({
    chain: 'eth', // The blockchain you want to use (eth/bsc/polygon) 
  });
  tokens =result.tokens;
  
  let parent = document.getElementById("token_list");
  for (const address in tokens){
    let token = tokens[address];
    let div = document.createElement("div");
    div.setAttribute("data-address", address);
    div.className = "token_row";
    let html = `
    <img class = "token_list_img" src = "${token.logoURI}">
    <span class="token_list_text">${token.symbol}</span>
    `
    div.innerHTML = html;
    div.onclick = (() => {selectToken(address)});
    parent.appendChild(div);
  }
}

/** Add from here down */
async function login() {
  try{
    currentUser = Moralis.User.current();
    if(!currentUser){
      currentUser = await Moralis.Web3.authenticate();
    }
    document.getElementById("swap_button").disabled = false; 
  } catch(error){
    console.log(error);
  }
}
function selectToken(address){
  closeModal();
  currentTrade[currentSelectSide] = tokens[address];
  console.log(currentTrade);
  rendrInterface();
  getQuote();

}

function rendrInterface(){
  if(currentTrade.from){
    document.getElementById("from_token_img").src = currentTrade.from.logoURI;
    document.getElementById("from_token_text").innerHTML = currentTrade.from.symbol;
  }
  if(currentTrade.to){
    document.getElementById("to_token_img").src = currentTrade.to.logoURI;
    document.getElementById("to_token_text").innerHTML = currentTrade.to.symbol;
  }
  
}

function openModal(side) {
  currentSelectSide = side;
  document.getElementById("token_model").style.display = "block";
}

function closeModal(side) {
  document.getElementById("token_model").style.display = "none";
}
async function getQuote(){
  if(!currentTrade.from || !currentTrade.to || !document.getElementById("from_amount").value)
  return
  let amount = Number(
      document.getElementById("from_amount").value* 10**currentTrade.from.decimals
    )
  const quote = await Moralis.Plugins.oneInch.quote({
    chain: 'eth', // The blockchain you want to use (eth/bsc/polygon)
    fromTokenAddress: currentTrade.from.address, // The token you want to swap
    toTokenAddress: currentTrade.to.address, // The token you want to receive
    amount: amount,
  });
  console.log(quote);  
  document.getElementById("gas_estimate").innerHTML = quote.estimatedGas;
  document.getElementById("to_amount").value = quote.toTokenAmount / (10**currentTrade.from.decimals)
}
async function trySwap(){
  let address = Moralis.User.current().get("ethAddress");
  let amount = Number(
    document.getElementById("from_amount").value* 10**currentTrade.from.decimals
  )
  if(currentTrade.from.symbol !== "ETH"){
    const allowance = await Moralis.Plugins.oneInch.hasAllowance({
      chain: 'eth', // The blockchain you want to use (eth/bsc/polygon)
      fromTokenAddress: currentTrade.from.address, // The token you want to swap
      fromAddress: address, // Your wallet address
      amount: amount,
    });
    console.log(`The user has enough allowance: ${allowance}`);
    if(!allowance){
      await Moralis.Plugins.oneInch.approve({
        chain: 'eth', // The blockchain you want to use (eth/bsc/polygon)
        tokenAddress: currentTrade.from.address, // The token you want to swap
        fromAddress: address, // Your wallet address
      });
    }
  }
  let receipt = await doSwap(address, amount);
  alert("Swap Complete");
}
function doSwap(userAddress, amount) {
  return Moralis.Plugins.oneInch.swap({
    chain: 'eth', // The blockchain you want to use (eth/bsc/polygon)
    fromTokenAddress: currentTrade.from.address, // The token you want to swap
    toTokenAddress: currentTrade.to.address, // The token you want to receive
    amount: amount,
    fromAddress: userAddress, // Your wallet address
    slippage: 1, // There is a 1% transaction fee on each swap.
  });
}
init();

document.getElementById("from_token_select").onclick = (()=> {openModal("from")});
document.getElementById("to_token_select").onclick = (()=> {openModal("to")});
document.getElementById("model_close").onclick = closeModal;
document.getElementById("btn-login").onclick = login;
document.getElementById("from_amount").onblur = getQuote;
document.getElementById("swap_button").onclick = trySwap;

/** Useful Resources  */

// https://docs.moralis.io/moralis-server/users/crypto-login
// https://docs.moralis.io/moralis-server/getting-started/quick-start#user
// https://docs.moralis.io/moralis-server/users/crypto-login#metamask

/** Moralis Forum */

// https://forum.moralis.io/