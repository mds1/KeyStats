// Various utility functions

// Convert from Wei to desired units
export function convert(convfactor, value) {
    return Array.isArray(value) ? value.map(x => x * convfactor) : value * convfactor
} // end convert


// Removes existing tables from div
export function removeExistingTable(divID) {
    if (jQuery(divID).html() != undefined && jQuery(divID).html().length > 0) {
        jQuery(divID).tabulator("destroy")
    }
}


// Calculate various statistics
export function calculateStatistics(address, statsM, statsN) {
    // statsM is mergerd normal/internal stats, containing total/sent/received as indices 0/1/2
    // statsN is normal stats, containing total/sent/received as indices 0/1/2

    // define array of all stats objects to loop through
    const statsT = statsM[0]
    const statsS = statsM[1]
    const statsR = statsM[2]
    const allstats = [statsT, statsS, statsR];

    // begin looping through them
    for (let statskey in allstats) {

        // get current stats object
        var stats = allstats[statskey];

        // get means, medians, and standard deviations
        for (let key in stats) {
            // get current field and values
            var val = stats[key].val

            // only compute statistics for array fields, skip the scalars (currently, just ntx)
            if (!Array.isArray(stats[key].val)) {
                continue;
            }

            // statistics common to all fields ------------------------------------------------
            stats[key].mean = jStat.mean(val)
            stats[key].stdev = jStat.stdev(val) // population standard deviation
            stats[key].median = jStat.median(val)
            stats[key].min = jStat.min(val)
            stats[key].max = jStat.max(val)

            // statistics only for certain fields --------------------------------------------
            // get cumulative sum of value fields
            const cumsumfieds = ["value", "valuereceived", "valuesent"]
            if (cumsumfieds.includes(key)) {
                stats[key].cumsum = jStat.cumsum(val);
            }

            // get cumulative sum of tx cost fields using normal TX data, since Etherscan API does not give gas costs for internal transactions
            const cumsumfiedsTX = ["txcost", "txcostreceived", "txcostsent"]
            if (cumsumfiedsTX.includes(key)) {
                stats[key].cumsum = jStat.cumsum(statsN[statskey][key].val);
            }

            // get cumsum while accounting for gas costs (for account balance vs. time)
            // NOTE: cumsumWithGas is currently not used, as Etherscan API does not give gas costs for internal transactions
            if (key == "value") {
                let cumsumWithGas = []; // array to be created
                let totalCurrentCost = 0; // next value to be added to above array
                let gasCostIndex = 0; // next index of statsS txcost array
                for (let i = 0; i < stats[key].val.length; i++) {

                    // add value of transaction to total
                    totalCurrentCost += stats[key].val[i];

                    // if current transaction value is negative, it was sent, so subtract gas also
                    if (stats[key].val[i] < 0) {
                        let gasCost = statsS.txcost.val[gasCostIndex];
                        totalCurrentCost -= gasCost;
                        gasCostIndex++;
                    }
                    cumsumWithGas.push(totalCurrentCost)
                }
                stats[key].cumsumWithGas = cumsumWithGas;
            }

            // get mode for certain fields
            if (key == "from" || key == "to") {
                // filter the from/to address fields to exclude the input address
                let filtered = stats[key].val.filter(function (i) { return i !== address.toLowerCase() })
                // stats[key].mode = jStat.mode(filtered);

                // get count of frequency each address was sent to/received from
                stats[key].frequencies = getFrequencies(filtered);

            } else if (key == "timeStamp") {
                // get mode of timeStamp normally
                stats[key].mode = jStat.mode(val);
                // also add this to the date field
                stats["date"].mode = new Date(stats[key].mode * 1000); // Date takes input in milliseconds, Etherscan returns seconds

            }
        } // end for each key in the stats object
    } // end for each stats type (total/sent/received)

    return [statsT, statsS, statsR];

} // end calculateStatistics


function getFrequencies(array) {
    // get frequency of each element in array
    let frequencies = {}
    for (let i = 0; i < array.length; i++) {
        var value = array[i];
        if (typeof frequencies[value] === "undefined") {
            // create key if it has not been seen yet
            frequencies[value] = 1;
        } else {
            // increment count if it has been seen
            frequencies[value]++;
        }
    }
    // remove addresses that are only there once
    // for (let key in frequencies) {
    //     if (frequencies[key] == 1) delete frequencies[key];
    // }

    return frequencies
} // end getModes


export function displayBalanceResults(accountBalance, currency) {
    // add horizontal separator lines
    jQuery('#horiz1').html('<hr>');
    jQuery('#horiz2').html('<hr>');

    // display balance
    jQuery('#balance').html('<p>Account Balance: ' + accountBalance.toLocaleString() + ' ' + currency + '</p>');

} // end displayBalanceResults


export function parseTransactionData(address, txlist) {

    // ensure input contains data
    if (txlist == null) {
        return
    }

    // get number of transactions found (normal + internal)
    const ntx = txlist.value.length;

    // Create template statistics arrays
    // total
    let statsT = {
        blockNumber: { val: [] },
        confirmations: { val: [] },
        contractAddress: { val: [] },
        cumulativeGasUsed: { val: [] }, // The total amount of gas used when this transaction was executed in the block. If being used with a smart contact, this would show the total amount of gas that has been used to interact with it.
        from: { val: [] }, // address of sender
        gas: { val: [] }, // gas limit, amount supplied for the tx
        gasPrice: { val: [] }, // The price offered to the miner to purchase this amount of gas, per gas
        gasUsed: { val: [] }, // amount of gas used by this specific transaction
        txcost: { val: [] }, // Gas Price * Gas Used By Transaction
        timeStamp: { val: [] }, // seconds since 01 January 1970 00:00:00 UTC
        date: { val: [] }, // used to store Date objects created from timeStamp
        to: { val: [] }, // address of receipient
        value: { val: [] }, // amount transferred to the recipient
        ntx: { val: [] }, // number of transactions found
    }

    // sent
    let statsS = {
        blockNumber: { val: [] },
        confirmations: { val: [] },
        contractAddress: { val: [] },
        cumulativeGasUsed: { val: [] },
        from: { val: [] },
        gas: { val: [] },
        gasPrice: { val: [] },
        gasUsed: { val: [] },
        txcost: { val: [] },
        timeStamp: { val: [] },
        date: { val: [] },
        to: { val: [] },
        value: { val: [] },
        ntx: { val: [] },
    };

    // received
    let statsR = {
        blockNumber: { val: [] },
        confirmations: { val: [] },
        contractAddress: { val: [] },
        cumulativeGasUsed: { val: [] },
        from: { val: [] },
        gas: { val: [] },
        gasPrice: { val: [] },
        gasUsed: { val: [] },
        txcost: { val: [] },
        timeStamp: { val: [] },
        date: { val: [] },
        to: { val: [] },
        value: { val: [] },
        ntx: { val: [] },
    };

    // assign number of transactions
    statsT.ntx.val = ntx;

    // loop through each found transaction and assign data to arrays
    for (let i = 0; i < ntx; i++) {
        // data received from Etherscan API
        statsT.blockNumber.val.push(txlist.blockNumber[i] * 1);
        statsT.confirmations.val.push(txlist.confirmations[i] * 1);
        statsT.contractAddress.val.push(txlist.contractAddress[i]);
        statsT.cumulativeGasUsed.val.push(txlist.cumulativeGasUsed[i] * 1);
        statsT.from.val.push(txlist.from[i]);
        statsT.gas.val.push(txlist.gas[i] * 1);
        statsT.gasPrice.val.push(txlist.gasPrice[i] * 1);
        statsT.gasUsed.val.push(txlist.gasUsed[i] * 1);
        statsT.txcost.val.push(txlist.gasPrice[i] * txlist.gasUsed[i]);
        statsT.timeStamp.val.push(txlist.timeStamp[i] * 1);
        statsT.date.val.push(new Date(txlist.timeStamp[i] * 1000)); // Date takes input in milliseconds, Etherscan returns seconds
        statsT.to.val.push(txlist.to[i]);

        // The 'value' field is added in the if statement, to flip sent transactions to negative

        // determine if transaction was sent or received and append data accordingly
        // change string to uppercase for case-insensitive comparison
        if (txlist.from[i].toUpperCase() == address.toUpperCase()) {
            // sent transaction
            statsS.blockNumber.val.push(statsT.blockNumber.val[i]);
            statsS.confirmations.val.push(statsT.confirmations.val[i]);
            statsS.contractAddress.val.push(statsT.contractAddress.val[i]);
            statsS.cumulativeGasUsed.val.push(statsT.cumulativeGasUsed.val[i]);
            statsS.from.val.push(statsT.from.val[i]);
            statsS.gas.val.push(statsT.gas.val[i]);
            statsS.gasPrice.val.push(statsT.gasPrice.val[i]);
            statsS.gasUsed.val.push(statsT.gasUsed.val[i]);
            statsS.txcost.val.push(statsT.txcost.val[i]);
            statsS.timeStamp.val.push(statsT.timeStamp.val[i]);
            statsS.date.val.push(statsT.date.val[i]);
            statsS.to.val.push(statsT.to.val[i]);
            statsS.value.val.push(txlist.value[i] * 1);

            // increment counter for number of transactions sent
            statsS.ntx.val++;

            // make value in statsT negative since transaction was sent
            statsT.value.val.push(txlist.value[i] * -1);
        }

        if (txlist.to[i].toUpperCase() == address.toUpperCase()) {
            // received transaction
            statsR.blockNumber.val.push(statsT.blockNumber.val[i]);
            statsR.confirmations.val.push(statsT.confirmations.val[i]);
            statsR.contractAddress.val.push(statsT.contractAddress.val[i]);
            statsR.cumulativeGasUsed.val.push(statsT.cumulativeGasUsed.val[i]);
            statsR.from.val.push(statsT.from.val[i]);
            statsR.gas.val.push(statsT.gas.val[i]);
            statsR.gasPrice.val.push(statsT.gasPrice.val[i]);
            statsR.gasUsed.val.push(statsT.gasUsed.val[i]);
            statsR.txcost.val.push(statsT.txcost.val[i]);
            statsR.timeStamp.val.push(statsT.timeStamp.val[i]);
            statsR.date.val.push(statsT.date.val[i]);
            statsR.to.val.push(statsT.to.val[i]);
            statsR.value.val.push(txlist.value[i] * 1);

            // increment counter for number of transactions received
            statsR.ntx.val++;

            // keep value in statsT positive since transaction was received
            statsT.value.val.push(txlist.value[i] * 1);
        }

    } // end looping through each found transaction to assign data to arrays

    return [statsT, statsS, statsR]
} // end parseTransactionData



export function mergeNormalAndInternalTXData(normalTXData, internalTXData) {
    // Unique to normal transactions:        Unique to internal transactions:
    //   - blockHash                            - errCode
    //   - confirmations                        - traceID
    //   - cumulativeGasUsed                    - type
    //   - gasPrice
    //   - nonce

    // Create array to hold all finalized data restructured by quantity names, as opposed to by transaction number
    let allTXData = {
        blockHash: [],
        blockNumber: [],
        confirmations: [],
        contractAddress: [],
        cumulativeGasUsed: [], // The total amount of gas used when this transaction was executed in the block. If being used with a smart contact, this would show the total amount of gas that has been used to interact with it.
        errCode: [],
        from: [], // address of sender
        gas: [], // gas limit, amount supplied for the tx
        gasPrice: [], // The price offered to the miner to purchase this amount of gas, per gas
        gasUsed: [], // amount of gas used by this specific transaction
        hash: [],
        input: [],
        isError: [],
        nonce: [],
        timeStamp: [], // seconds since 01 January 1970 00:00:00 UTC
        to: [], // address of receipient
        traceId: [],
        transactionIndex: [],
        type: [],
        value: [] // amount transferred to the recipient
    }

    // Create array to hold normalTXData restructured by quantity names
    let newNormalTXData = {
        blockHash: [],
        blockNumber: [],
        confirmations: [],
        contractAddress: [],
        cumulativeGasUsed: [], // The total amount of gas used when this transaction was executed in the block. If being used with a smart contact, this would show the total amount of gas that has been used to interact with it.
        from: [], // address of sender
        gas: [], // gas limit, amount supplied for the tx
        gasPrice: [], // The price offered to the miner to purchase this amount of gas, per gas
        gasUsed: [], // amount of gas used by this specific transaction
        hash: [],
        input: [],
        isError: [],
        nonce: [],
        timeStamp: [], // seconds since 01 January 1970 00:00:00 UTC
        to: [], // address of receipient
        transactionIndex: [],
        value: [] // amount transferred to the recipient
    }

    // Create array to hold internalTXData restructured by quantity names
    let newInternalTXData = {
        blockNumber: [],
        contractAddress: [],
        errCode: [],
        from: [], // address of sender
        gas: [], // gas limit, amount supplied for the tx
        gasUsed: [], // amount of gas used by this specific transaction
        hash: [],
        input: [],
        isError: [],
        timeStamp: [], // seconds since 01 January 1970 00:00:00 UTC
        to: [], // address of receipient
        traceId: [],
        transactionIndex: [],
        type: [],
        value: [] // amount transferred to the recipient
    }

    // if internalTXData is null, just return reformatted normalTXData
    let nidx = 0; // index for normal transactions
    if (internalTXData == null) {
        newInternalTXData = null
        for (let nidx = 0; nidx < normalTXData.length; nidx++) {
            allTXData = appendNormalTXData(allTXData, normalTXData, nidx)
            newNormalTXData = appendNormalTXData(newNormalTXData, normalTXData, nidx)
        }
        return [allTXData, newNormalTXData, newInternalTXData]
    }

    // if normalTXData is null, just return reformatted internalTXData
    let iidx = 0; // index for internal transactions
    if (normalTXData == null) {
        newNormalTXData = null
        for (let iidx = 0; iidx < internalTXData.length; iidx++) {
            allTXData = appendInternalTXData(allTXData, internalTXData, iidx)
            newInternalTXData = appendInternalTXData(newInternalTXData, internalTXData, iidx)
        }
        return [allTXData, newNormalTXData, newInternalTXData]
    }



    // Otherwise, merge the two by comparing timestamps

    // For each normal transaction and internal transaction
    while (nidx < normalTXData.length || iidx < internalTXData.length) {

        // If normal transaction occurred first (first check if we've exhausted all internal transactions, then compare timeStamp)
        if (iidx >= internalTXData.length || Number(normalTXData[nidx].timeStamp) < Number(internalTXData[iidx].timeStamp)) {
            // append normal transaction data to allTXData
            allTXData = appendNormalTXData(allTXData, normalTXData, nidx)
            newNormalTXData = appendNormalTXData(newNormalTXData, normalTXData, nidx)

            // increment index
            nidx++

        } else {
            // append internal transaction data to allTXData (gas stats are excluded since they are incomplete)
            allTXData = appendInternalTXData(allTXData, internalTXData, iidx)
            newInternalTXData = appendInternalTXData(newInternalTXData, internalTXData, iidx)

            // increment index
            iidx++
        }
    }

    return [allTXData, newNormalTXData, newInternalTXData]


} // end mergeNormalAndInternalTXData


function appendNormalTXData(allTXData, normalTXData, nidx) {
    allTXData.blockHash.push(normalTXData[nidx].blockHash);
    allTXData.blockNumber.push(normalTXData[nidx].blockNumber);
    allTXData.confirmations.push(normalTXData[nidx].confirmations);
    allTXData.contractAddress.push(normalTXData[nidx].contractAddress);
    allTXData.cumulativeGasUsed.push(normalTXData[nidx].cumulativeGasUsed); // The total amount of gas used when this transaction was executed in the block. If being used with a smart contact, this would show the total amount of gas that has been used to interact with it.
    allTXData.from.push(normalTXData[nidx].from); // address of sender
    allTXData.gas.push(normalTXData[nidx].gas); // gas limit, amount supplied for the tx
    allTXData.gasPrice.push(normalTXData[nidx].gasPrice); // The price offered to the miner to purchase this amount of gas, per gas
    allTXData.gasUsed.push(normalTXData[nidx].gasUsed); // amount of gas used by this specific transaction
    allTXData.hash.push(normalTXData[nidx].hash);
    allTXData.input.push(normalTXData[nidx].input);
    allTXData.isError.push(normalTXData[nidx].isError);
    allTXData.nonce.push(normalTXData[nidx].nonce);
    allTXData.timeStamp.push(normalTXData[nidx].timeStamp); // seconds since 01 January 1970 00:00:00 UTC
    allTXData.to.push(normalTXData[nidx].to); // address of receipient
    allTXData.transactionIndex.push(normalTXData[nidx].transactionIndex);
    allTXData.value.push(normalTXData[nidx].value); // amount transferred to the recipient

    return allTXData
} // end appendNormalTXData


function appendInternalTXData(allTXData, internalTXData, iidx) {
    allTXData.blockNumber.push(internalTXData[iidx].blockNumber);
    allTXData.contractAddress.push(internalTXData[iidx].contractAddress);
    allTXData.errCode.push(internalTXData[iidx].errCode);
    allTXData.from.push(internalTXData[iidx].from); // address of sender
    allTXData.hash.push(internalTXData[iidx].hash);
    allTXData.input.push(internalTXData[iidx].input);
    allTXData.isError.push(internalTXData[iidx].isError);
    allTXData.timeStamp.push(internalTXData[iidx].timeStamp); // seconds since 01 January 1970 00:00:00 UTC
    allTXData.to.push(internalTXData[iidx].to); // address of receipient
    allTXData.traceId.push(internalTXData[iidx].traceId);
    allTXData.transactionIndex.push(internalTXData[iidx].transactionIndex);
    allTXData.type.push(internalTXData[iidx].type);
    allTXData.value.push(internalTXData[iidx].value); // amount transferred to the recipient

    return allTXData
} // end appendInternalTXData


// Deep merge of two objects (source: https://stackoverflow.com/questions/27936772/how-to-deep-merge-instead-of-shallow-merge)
export function deepMerge(target, ...sources) {
    if (!sources.length) return target;
    const source = sources.shift();

    if (isObject(target) && isObject(source)) {
        for (const key in source) {
            if (isObject(source[key])) {
                if (!target[key]) Object.assign(target, { [key]: {} });
                deepMerge(target[key], source[key]);
            } else {
                Object.assign(target, { [key]: source[key] });
            }
        }
    }

    return deepMerge(target, ...sources);
} // end deepMerge


// Format date from txdata as string in yyyy-mm-dd hh:mm:ss format
export function formatDate(txdata, idx) {
    const date = new Date(txdata.timeStamp[idx] * 1000)
    const year = String(date.getFullYear())
    const month = padnumber(date.getMonth() + 1)
    const day = padnumber(date.getDate())
    const hours = padnumber(date.getHours())
    const mins = padnumber(date.getMinutes())
    const secs = padnumber(date.getSeconds())

    return year + '-' + month + '-' + day + ' ' + hours + ':' + mins + ':' + secs
}


// Add leading 0 to single digit numbers
function padnumber(n) {
    return String("0" + n).slice(-2);
}


// Simple check if an item is an object (source: https://stackoverflow.com/questions/27936772/how-to-deep-merge-instead-of-shallow-merge)
function isObject(item) {
    return (item && typeof item === 'object' && !Array.isArray(item));
} // end isObject
