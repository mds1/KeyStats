// API calls and associated functions

// ====================================================================================
// =========================== Etherscan Address Info APIs ============================
// ====================================================================================

export function getBalanceFromEtherscan(address) {
    // Build API query
    const query = 'https://api.etherscan.io/api?module=account&action=balance&address=' + address + '&tag=latest';//&apikey=' + apiKey; //+ '?callback=?';

    // send request
    return jQuery.getJSON(query);
}


export function getTXFromEtherscan(address) {
    // Build API query -- Returns up to a maximum of the last 10000 transactions only
    const query = 'https://api.etherscan.io/api?module=account&action=txlist&address=' + address + '&startblock=0&endblock=99999999&sort=asc';//&apikey=' + apiKey;

    // send request
    return jQuery.getJSON(query);

    // RETURNS:
    // data:
    //   message: "OK"
    //   result: Array(4)
    //   0:
    //      *blockHash: ""
    //      blockNumber: ""
    //      *confirmations: ""
    //      contractAddress: ""
    //      *cumulativeGasUsed: ""
    //      from: ""
    //      gas: ""
    //      *gasPrice: ""
    //      gasUsed: ""
    //      hash: ""
    //      input: "0x"
    //      isError: "0"
    //      *nonce: "0"
    //      timeStamp: ""
    //      to: ""
    //      transactionIndex: ""
    //      value: ""
    //   1: ............
    //   2: ............

}


export function getInternalTXFromEtherscan(address) {
    // Build API query -- Returns up to a maximum of the last 10000 transactions only
    const query = 'https://api.etherscan.io/api?module=account&action=txlistinternal&address=' + address + '&startblock=0&endblock=2702578&sort=asc';//&apikey=' + apiKey;

    // send request
    return jQuery.getJSON(query);

    // RETURNS:
    // data:
    //   message: "OK"
    //   result: Array(4)
    //   0:
    //      blockNumber: ""
    //      contractAddress: ""
    //      *errCode: ""
    //      from: ""
    //      gas: "2300"
    //      gasUsed: "0"
    //      hash: ""
    //      input: ""
    //      isError: "0"
    //      timeStamp: ""
    //      to: ""
    //      *traceId: "1"
    //      *type: "call"
    //      value: ""
    //   1:   ............
    //   2:   ............

}


// ====================================================================================
// ============================= Currency Conversion APIs =============================
// ====================================================================================

// Get currency conversion factors
export async function getconvfactor(currency) {

    if (currency == 'ETH') {
        // If using ETH, get WEI to ETH conversion factor
        const convfactor = { wei2eth: 1 / 1e18 }
        return convfactor

    } else if (currency == 'USD') {
        // If using USD, get ETH to USD conversion factor from Etherscan API
        const eth2usd = await getETHUSDPrice();
        const convfactor = {
            eth2usd: eth2usd,
            wei2eth: 1 / 1e18,
            wei2usd: eth2usd / 1e18 // wei2usd = wei2eth * eth2usd
        }
        return convfactor
    }

}


// Currency functions
async function getETHconversion(currency) {
    // Build API query
    const query = 'https://api.coinmarketcap.com/v1/ticker/ethereum/?convert=' + currency

    // send request
    return jQuery.getJSON(query)
}


// ====================================================================================
// ================================== Call All APIs ===================================
// ====================================================================================

export async function callAPIs(address, isValid, currency) {
    // const balanceData = await getBalanceFromEtherscan(address)
    // const normalTXData = await getTXFromEtherscan(address)
    // const internalTXData = await getInternalTXFromEtherscan(address)
    // etc...

    const [balanceData, normalTXData, internalTXData, convfactor] = await Promise.all([getBalanceFromEtherscan(address), getTXFromEtherscan(address), getInternalTXFromEtherscan(address), getETHconversion(currency)]);
    return [balanceData, normalTXData, internalTXData, convfactor]
}
