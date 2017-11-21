// Everything related to generating figures/tables

import * as utilities from "./utilities.js";

// =================================================================================================
// ========================== Define Settings Common to Multiple Figures ===========================
// =================================================================================================

// define color of text
const textcolor = '#FFFFFF';

// define color of background
const bgcolor = '#0B0C10';

// define color of KeyStats logo
const kscolor = '#1EBAFF';

// set plot colors
const colors = {
    blue: '#1f77b4',  // muted blue
    orange: '#ff7f0e',  // safety orange
    green: '#2ca02c',  // cooked asparagus green
    red: '#d62728',  // brick red
    purple: '#9467bd',  // muted purple
    brown: '#8c564b',  // chestnut brown
    pink: '#e377c2',  // raspberry yogurt pink
    gray: '#7f7f7f',  // middle gray
    yellowgreen: '#bcbd22',  // curry yellow-green
    blueteal: '#17becf'   // blue-teal
};

const totalcolor = colors.green; // color for total transaction data
const sentcolor = colors.blue; // color for sent transaction data
const receivedcolor = colors.orange; // color for received transaction data

// common plot layout settings
const layoutcommon = {
    paper_bgcolor: bgcolor, // sets background color
    plot_bgcolor: bgcolor
}

// line plot settings
const linewidth = 3;

// bar plot settings
const barwidth = 0.55;

// box plot settings
const boxpoints = 'all'; // which data points to display
const boxmean = 'sd'; // 'sd' shows mean and standard deviation with dotted line
const jitter = 0.3; // ammount of side-to-side deviation between points, 0 is straight line
const pointpos = -1.8; // position of sample points relative to boxes, 0 puts points on the box center
const orientation = 'h'; // 'v' for vertical, or 'h' for horizontal

// set date selector options
const selectorOptions = {
    buttons: [{
        step: 'month',
        stepmode: 'backward',
        count: 1,
        label: '1m'
    }, {
        step: 'month',
        stepmode: 'backward',
        count: 3,
        label: '3m'
    },
    {
        step: 'month',
        stepmode: 'backward',
        count: 6,
        label: '6m'
    }, {
        step: 'year',
        stepmode: 'backward',
        count: 1,
        label: '1y'
    }, {
        step: 'year',
        stepmode: 'todate',
        count: 1,
        label: 'YTD'
    }, {
        step: 'all',
        label: 'All'
    }],
};



// =================================================================================================
// ==================================== Main Plotting Function =====================================
// =================================================================================================

export function generateFigures(statsT, statsS, statsR, normalTXData, internalTXData, address, convfactor, currency) {

    // configure limits for plots with Date on the x-axis
    const datemin = new Date(1000 * Math.min(...statsT.timeStamp.val));
    const datemax = new Date(1000 * Math.max(...statsT.timeStamp.val));

    datemin.setDate(datemin.getDate() - 3); // x-min is earliest date minus 3 days
    datemax.setDate(datemax.getDate() + 3); // x-max is earliest date plus 3 days

    // get total/sent/received for normal TX data for tx cost plots
    const statsN = utilities.parseTransactionData(address, normalTXData)
    const statsNT = statsN[0]
    const statsNS = statsN[1]
    const statsNR = statsN[2]

    // -------------------------------------------------------------------------------------
    // ---------------------------------- Line Graph ---------------------------------------
    // --------------------------- Account Balance vs. Time --------------------------------
    // -------------------------------------------------------------------------------------

    // define HTML div name
    var divID = "accountBalanceVsTime";

    // define data
    var trace = {
        x: statsT.date.val, // date
        y: utilities.convert(convfactor, statsT.value.cumsum),
    }

    // define layout
    var layout = {
        title: 'Account Balance vs. Time',
        xaxis: {
            title: 'Date',
            range: [datemin.getTime(), datemax.getTime()],
        },
        yaxis: { title: 'Balance (' + currency + ')' },
    }

    // make plot
    lineDatePlot(divID, trace, layout)


    // -------------------------------------------------------------------------------------
    // ------------------------------------ Line Graph -------------------------------------
    // ------------------------------ Total Gas Cost vs. Time ------------------------------
    // -------------------------------------------------------------------------------------

    // define HTML div name
    var divID = "totalGasCostVsTime";

    // define data
    var traceT = {
        x: statsNT.date.val, // date, using statsNT for dates of normal transactions
        y: utilities.convert(convfactor, statsT.txcost.cumsum), // using statsT since only normal transactions are used to compute gas stats
        line: { color: totalcolor },
        name: 'Total',
    }

    var traceS = {
        x: statsNS.date.val, // date
        y: utilities.convert(convfactor, statsS.txcost.cumsum),
        line: { color: sentcolor },
        name: 'Sent',
    }

    var traceR = {
        x: statsNR.date.val, // date
        y: utilities.convert(convfactor, statsR.txcost.cumsum),
        line: { color: receivedcolor },
        name: 'Received'
    }

    // define layout
    var layout = {
        title: 'Cumulative Transaction Cost vs. Time',
        xaxis: {
            title: 'Date',
            range: [datemin.getTime(), datemax.getTime()],
        },
        yaxis: { title: 'Cumulative Transaction Cost (' + currency + ')' },
        legend: {
            orientation: 'h',
            x: 0.7,
            y: 1.175,
        }
    }

    // make plot
    lineDateTriplePlot(divID, traceT, traceS, traceR, layout)


    // -------------------------------------------------------------------------------------
    // ------------------------------------- Bar Graph -------------------------------------
    // ------------------ Number and Value of Transactions Sent/Received -------------------
    // -------------------------------------------------------------------------------------

    // define HTML div name
    var divID = "NumAndQtyOfSentAndRecTX";

    // define data
    const ntx = [statsS.ntx.val, statsR.ntx.val]; // number of transactions sent and received
    const valSent = utilities.convert(convfactor, statsS.value.cumsum[statsS.ntx.val - 1]); // value of sent transactions
    const valReceived = utilities.convert(convfactor, statsR.value.cumsum[statsR.ntx.val - 1]); // value of received transactions
    const yValue = [valSent, valReceived];

    var trace1 = {
        // number of transactions
        x: ['Sent', 'Received'],
        y: ntx,
        marker: { color: [sentcolor, receivedcolor] },
        text: [ntx[0].toLocaleString(), ntx[1].toLocaleString()], // shows numbers on bars
        hovertext: ['Total Number of Transactions Sent', 'Total Number of Transactions Received'],
        hoverinfo: 'y+text',
    };

    var trace2 = {
        // balance of transactions
        x: ['Sent', 'Received'],
        y: yValue,
        marker: { color: [sentcolor, receivedcolor] },
        text: [yValue[0].toLocaleString(), yValue[1].toLocaleString()], // shows numbers on bars
        hovertext: ['Total Value of Sent Transactions', 'Total Value of Received Transactions'],
        hoverinfo: 'y+text',
    };

    // define layout
    var layout = {
        title: 'Transactions Summary',
        annotations: [ // used to add titles to each subplot
            { text: 'Total Number of Transactions', },
            { text: 'Total Value of Transactions (' + currency + ')', }
        ]
    };

    // make plot
    dualBarPlot(divID, trace1, trace2, layout)


    // -------------------------------------------------------------------------------------
    // ----------------------------------- Scatter Plot ------------------------------------
    // ------------------- Value of Transactions Sent/Received vs. Date --------------------
    // -------------------------------------------------------------------------------------

    // define HTML div name
    var divID = "scatterOfTXValue";

    // define data
    var trace1 = {
        x: statsS.date.val,
        y: utilities.convert(convfactor, statsS.value.val),
        marker: { color: sentcolor },
        name: 'Sent'
    };

    var trace2 = {
        x: statsR.date.val,
        y: utilities.convert(convfactor, statsR.value.val),
        marker: { color: receivedcolor },
        name: 'Received'
    };

    // define layout
    var layout = {
        title: 'All Transaction Values',
        legend: {
            orientation: 'h',
            x: 0.8,
            y: 1.15,
            xanchor: 'left',
            yanchor: 'top'
        },
        xaxis: {
            title: 'Date',
            range: [datemin.getTime(), datemax.getTime()],
        },
        yaxis: {
            title: 'Value (' + currency + ')',
        },
    };

    // make plot
    scatterDateDualPlot(divID, trace1, trace2, layout, currency)



    // -------------------------------------------------------------------------------------
    // ----------------------------------- Scatter Plot ------------------------------------
    // ---------------------- Transaction Cost Sent/Received vs. Date ----------------------
    // -------------------------------------------------------------------------------------

    // define HTML div name
    var divID = "scatterOfTXCost";

    // define data
    var trace1 = {
        x: statsNS.date.val,
        y: utilities.convert(convfactor, statsNS.txcost.val), // using statsNS here since it will have the val field, as value is not a computed statistic
        marker: { color: sentcolor },
        name: 'Sent'
    };

    var trace2 = {
        x: statsNR.date.val,
        y: utilities.convert(convfactor, statsNR.txcost.val),
        marker: { color: receivedcolor },
        name: 'Received'
    };

    // define layout
    var layout = {
        title: 'All Transaction Costs',
        legend: {
            orientation: 'h',
            x: 0.8,
            y: 1.15,
            xanchor: 'left',
            yanchor: 'top'
        },
        xaxis: {
            title: 'Date',
            range: [datemin.getTime(), datemax.getTime()],
        },
        yaxis: {
            title: 'Value (' + currency + ')',
        },
    };

    // make plot
    scatterDateDualPlot(divID, trace1, trace2, layout, currency)


    // -------------------------------------------------------------------------------------
    // ------------------------------------ Box Plot ---------------------------------------
    // ------------------------ Value of Transactions Sent/Received ------------------------
    // -------------------------------------------------------------------------------------

    // define HTML div name
    var divID = "boxPlotOfTXValue";

    // define data
    var traceT = {
        x: utilities.convert(convfactor, statsT.value.val).map(x => Math.abs(x)),
        name: 'Total',
        marker: { color: totalcolor }
    };
    var traceS = {
        x: utilities.convert(convfactor, statsS.value.val),
        name: 'Sent',
        marker: { color: sentcolor }
    };
    var traceR = {
        x: utilities.convert(convfactor, statsR.value.val),
        name: 'Received',
        type: 'box',
        marker: { color: receivedcolor }
    };

    // define layout
    var layout = {
        title: 'Distribution of Transaction Values',
        xaxis: {
            title: 'Transaction Value (' + currency + ')'
        },
        legend: {
            orientation: 'h',
            x: 0.7,
            y: 1.175,
        },
    };

    boxTriplePlot(divID, traceT, traceS, traceR, layout)



    // -------------------------------------------------------------------------------------
    // ------------------------------------ Box Plot ---------------------------------------
    // ------------------------ Cost of Transactions Sent/Received -------------------------
    // -------------------------------------------------------------------------------------

    // define HTML div name
    var divID = "boxPlotOfTXCost";

    // define data
    var traceT = {
        x: utilities.convert(convfactor, statsT.txcost.val).map(x => Math.abs(x)),
        name: 'Total',
        marker: { color: totalcolor }
    };
    var traceS = {
        x: utilities.convert(convfactor, statsS.txcost.val),
        name: 'Sent',
        marker: { color: sentcolor }
    };
    var traceR = {
        x: utilities.convert(convfactor, statsR.txcost.val),
        name: 'Received',
        type: 'box',
        marker: { color: receivedcolor }
    };

    // define layout
    var layout = {
        title: 'Distribution of Transaction Costs',
        xaxis: {
            title: 'Transaction Value (' + currency + ')'
        },
        legend: {
            orientation: 'h',
            x: 0.7,
            y: 1.175,
        },
    };

    boxTriplePlot(divID, traceT, traceS, traceR, layout)



    // -------------------------------------------------------------------------------------
    // ---------------------------------- Titles/Tooltips ----------------------------------
    // --------------------------- Add titles and tooltips here ----------------------------
    // -------------------------------------------------------------------------------------

    // create variable to add 'info' icon, which indicates there is a tooltip
    const addinfo = '&nbsp;&nbsp;<i class="fa fa-info-circle" aria-hidden="true"></i>'

    // define tooltip phrases
    const acctbaltooltip = "Transaction values and account balance only factor in the value of transactions, not their gas costs. This was done for consistency, as this site uses the Etherscan API which does not provide gas information for transactions resulting from contract execution."
    const txcosttooltip = "Transaction cost figures currently only account for normal transactions. This site uses the Etherscan API which does not provide gas information for transactions resulting from contract execution."
    const normaltxtooltip = "Dates and times are based on your local time zone as determined by the broswer"

    // add titles
    jQuery('#TXValueTitle').html('<b><h3 class="tt" title="' + acctbaltooltip + '" style="color:' + textcolor + '";>Transaction Value' + addinfo + '</h3></b>');
    jQuery('#TXCostTitle').html('<b><h3 class="tt" title="' + txcosttooltip + '" style= "color:' + textcolor + '";>Transaction Cost' + addinfo + '</h3 ></b > ');

    if (normalTXData != null) {
        jQuery('#normalTXtitle').html('<h3 class="tt" title="' + normaltxtooltip + '" style="color:' + textcolor + '";>Summary of Transactions' + addinfo + '</h3>');
    }
    if (internalTXData != null) {
        jQuery('#internalTXtitle').html('<h3 class="tt" title="' + normaltxtooltip + '" style="color:' + textcolor + '";>Summary of Internal Transactions (from Contract Execution)' + addinfo + '</h3>');
    }

    // add tooltips
    tippy('.tt', {
        theme: 'dark',
        arrow: true
    })

    // -------------------------------------------------------------------------------------
    // -------------------------------------- Tables ---------------------------------------
    // ------------------------ All Table Functions Are Called Here ------------------------
    // -------------------------------------------------------------------------------------

    // Generate table of frequency of addresses sent to
    jQuery('#frequencyTitle').html('<h3 style="color:' + textcolor + '";>Interaction Frequency with Other Addresses</h3>');
    var divID = '#tableOfSentAddressFrequency'
    const sentFreqData = statsS.to.frequencies
    generateFreqTable(divID, sentFreqData, 'Sent')

    // Generate table of frequency of addresses received from
    var divID = '#tableOfReceivedAddressFrequency'
    const receivedFreqData = statsR.from.frequencies
    generateFreqTable(divID, receivedFreqData, 'Received')

    // Generates table of date/from/direction/to/value/txcost normal transactions, but is sortable/filterable
    var divID = '#tableOfNormalTXData'
    generateNormalTXTable(divID, normalTXData, address, convfactor, currency)

    // Generates the 6 column table shown on Etherscan for internal transactions, but is sortable/filterable
    var divID = '#tableOfInternalTXData'
    generateInternalTXTable(divID, internalTXData, address, convfactor, currency)

}

// =================================================================================================
// ================================== Plotting Wrapper Functions ===================================
// =================================================================================================

// Generates plot with single line of data and dates on the x-axis
function lineDatePlot(divID, plotdata, layoutdata) {
    // Configure plot data ------------------------------------------------------
    // define settings
    var trace = {
        mode: 'lines',
        line: {
            color: totalcolor,
            width: linewidth,
            shape: 'hv'
        }
    }

    // merge plot objects
    trace = utilities.deepMerge(plotdata, trace)
    // Configure layout data ----------------------------------------------------
    // define settings
    var layout = {
        titlefont: {
            color: textcolor
        },
        xaxis: {
            color: textcolor,
            rangeselector: selectorOptions,
            rangeslider: {}
        },
        yaxis: {
            color: textcolor,
            fixedrange: true
        },
    };

    // merge layout objects
    layout = utilities.deepMerge(layout, layoutdata, layoutcommon)
    // Make plot ----------------------------------------------------------------
    Plotly.newPlot(divID, [trace], layout);
} // end lineDatePlot


// Generates plot with three lines of data and dates on the x-axis
function lineDateTriplePlot(divID, plotdata1, plotdata2, plotdata3, layoutdata) {
    // Configure plot data ------------------------------------------------------
    // define settings
    var trace = {
        mode: 'lines',
        line: {
            width: linewidth,
            shape: 'hv'
        }
    }

    // merge plot objects ('trace' must be a source here, not a target)
    var trace1 = utilities.deepMerge(plotdata1, trace)
    var trace2 = utilities.deepMerge(plotdata2, trace)
    var trace3 = utilities.deepMerge(plotdata3, trace)

    var trace = [trace1, trace2, trace3]

    // Configure layout data ----------------------------------------------------
    // define settings
    var layout = {
        titlefont: {
            color: textcolor
        },
        xaxis: {
            color: textcolor,
            rangeselector: selectorOptions,
            rangeslider: {}
        },
        yaxis: {
            color: textcolor,
            fixedrange: true
        },
        legend: {
            font: { color: textcolor },
        },
    };

    // merge layout objects
    layout = utilities.deepMerge(layout, layoutdata, layoutcommon)

    // Make plot ----------------------------------------------------------------
    Plotly.newPlot(divID, trace, layout);
} // end lineDateTriplePlot


// Generates bar plots with two sources of data on the same plot
function dualBarPlot(divID, plotdata1, plotdata2, layoutdata) {
    // Configure plot data ------------------------------------------------------
    // common to both traces
    var trace = {
        textposition: 'auto',
        textfont: { color: textcolor },
        hoverlabel: { namelength: -1 },
        width: [barwidth, barwidth],
        type: 'bar',
        showlegend: false
    };

    // only for second trace
    var trace2 = {
        xaxis: 'x2',
        yaxis: 'y2'
    }

    // merge plot objects ('trace' must be a source here, not a target)
    var trace1 = utilities.deepMerge(plotdata1, trace)
    var trace2 = utilities.deepMerge(plotdata2, trace, trace2)
    var trace = [trace1, trace2];

    // Configure layout data ----------------------------------------------------
    var layout = {
        titlefont: { color: textcolor },
        xaxis: {
            domain: [0, 0.4],
            color: textcolor
        },
        yaxis: { color: textcolor },
        xaxis2: {
            domain: [0.6, 1],
            color: textcolor
        },
        yaxis2: {
            anchor: 'x2',
            color: textcolor
        },
    };

    // merge layout data (update annotations here since they don't merge properly)
    layout = utilities.deepMerge(layout, layoutdata, layoutcommon)
    layout.annotations =  // used to add titles to each subplot
        [{
            xref: 'paper',
            yref: 'paper',
            x: 0.2,
            xanchor: 'center',
            y: 1,
            yanchor: 'bottom',
            showarrow: false,
            font: {
                color: textcolor,
                size: 14
            },
            text: layoutdata.annotations[0].text, // from input
        }, {
            xref: 'paper',
            yref: 'paper',
            x: 0.8,
            xanchor: 'center',
            y: 1,
            yanchor: 'bottom',
            showarrow: false,
            font: {
                color: textcolor,
                size: 14
            },
            text: layoutdata.annotations[1].text, // from input
        }]

    // Make plot ----------------------------------------------------------------
    Plotly.newPlot(divID, trace, layout);
} // end dualBarPlot


// Generates scatter plot with two sources of data, and dates on the x-axis
function scatterDateDualPlot(divID, plotdata1, plotdata2, layoutdata, currency) {
    // Configure plot data ------------------------------------------------------
    // common to both traces
    var trace = {
        mode: 'markers',
        type: 'scatter',
    };

    // merge plot objects ('trace' must be a source here, not a target)
    var trace1 = utilities.deepMerge(plotdata1, trace)
    var trace2 = utilities.deepMerge(plotdata2, trace)
    var trace = [trace1, trace2];

    // Configure layout data ----------------------------------------------------
    var layout = {
        legend: {
            font: { color: textcolor },
        },
        titlefont: { color: textcolor },
        xaxis: {
            color: textcolor,
            rangeselector: selectorOptions,
            rangeslider: {}
        },
        yaxis: {
            title: 'Value (' + currency + ')',
            color: textcolor,
            fixedrange: true
        },
    };

    // merge layout data
    layout = utilities.deepMerge(layout, layoutdata, layoutcommon)

    // Make plot ----------------------------------------------------------------
    Plotly.newPlot(divID, trace, layout);
} // end scatterDateDualPlot


// Generates box plot with three sources of data
function boxTriplePlot(divID, plotdata1, plotdata2, plotdata3, layoutdata) {
    // Configure plot data ------------------------------------------------------
    // common to both traces
    var trace = {
        type: 'box',
        boxpoints: boxpoints,
        boxmean: boxmean,
        jitter: jitter,
        pointpos: pointpos,
        orientation: orientation,
    };

    // merge plot objects ('trace' must be a source here, not a target)
    var trace1 = utilities.deepMerge(plotdata1, trace)
    var trace2 = utilities.deepMerge(plotdata2, trace)
    var trace3 = utilities.deepMerge(plotdata3, trace)
    var trace = [trace1, trace2, trace3];

    // Configure layout data ----------------------------------------------------
    var layout = {
        titlefont: { color: textcolor },
        xaxis: {
            color: textcolor,
        },
        yaxis: { color: textcolor },
        legend: {
            font: { color: textcolor },
        },
    };

    // merge layout data
    layout = utilities.deepMerge(layout, layoutdata, layoutcommon)

    // Make plot ----------------------------------------------------------------
    Plotly.newPlot(divID, trace, layout);
} // end boxTriplePlot


// Generates 4 column table with as many rows as the data has -- used for sent/received address frequencies
function generateFreqTable(divID, freqData, direction) {

    // break if no data
    if (freqData == null) {
        return
    }

    // create object to hold table data
    let tableData = []

    // Generate table data
    // Configure variables based on transaction direction
    if (direction == "Sent") {
        var column1header = "Address Sent To" // "Uncaught ReferenceError: column1header is not defined" if scoped as 'const' or 'let'
    } else {
        var column1header = "Address Received From"  // "Uncaught ReferenceError: column1header is not defined" if scoped as 'const' or 'let'
    }

    const addresses = Object.keys(freqData) // addresses from input
    const freqs = Object.values(freqData) // frequencies from input
    const maxFreq = Math.max(...freqData) // max frequency

    // add transactions to tableData array
    for (let i = 0; i < addresses.length; i++) {
        tableData.push({
            id: i + 1,
            address: addresses[i],
            frequency: freqs[i],
            direction: direction,
        })
    }

    // Generate table
    const columns = [
        { title: column1header, field: "address", sorter: "string", },//minWidth: 275 },
        { title: "Direction", field: "direction", visible: false },
        { title: "Frequency", field: "frequency", formatter: "plaintext", sorter: "number" },
    ]
    // Turn element into a Tabulator by passing a constructor object to the tabulator jQuery widget
    // jQuery(divID).tabulator("destroy");
    jQuery(divID).tabulator({
        // height: "100%", // set height of table, this enables the Virtual DOM and improves render speed dramatically (can be any valid css height value)
        layout: "fitColumns",
        //    columnMinWidth: 135,
        pagination: "local",
        paginationSize: 5,
        columns: columns,
        initialSort: [
            { column: "frequency", dir: "desc" }, //sort by frequency
        ]
    });

    //load data into the table
    jQuery(divID).tabulator("setData", tableData);

} // end generateFreqTable


// Generates the 8 column table shown on Etherscan for normal transactions, but is sortable/filterable
function generateNormalTXTable(divID, normalTXData, address, convfactor, currency) {

    // break if no data
    if (normalTXData == null) {
        return
    }

    // create object to hold table data
    const tableData = []

    // add transactions to tableData array
    for (let i = 0; i < normalTXData.value.length; i++) {
        // get direction of transaction
        if (normalTXData.from[i].toUpperCase() == address.toUpperCase()) {
            var direction = 'Sent'
        } else if (normalTXData.to[i].toUpperCase() == address.toUpperCase()) {
            var direction = 'Received'
        }

        // configure Etherscan hyperlink to txhash
        const txhash = normalTXData.hash[i]
        const txhashlink = "https://etherscan.io/tx/" + txhash
        const txhashhtml = "<a href=\"" + txhashlink + "\"target=\"_blank\">" + txhash + "</a>"

        // add data
        tableData.push({
            id: i + 1,
            // txhash: normalTXData.hash[i],
            // block: normalTXData.blockNumber[i],
            date: utilities.formatDate(normalTXData, i),
            from: normalTXData.from[i],
            direction: direction,
            to: normalTXData.to[i],
            value: utilities.convert(convfactor, normalTXData.value[i]).toLocaleString(),
            txcost: utilities.convert(convfactor, normalTXData.gasPrice[i] * normalTXData.gasUsed[i]),
            txhash: txhashhtml
        })
    }

    // Generate table
    // Turn element into a Tabulator by passing a constructor object to the tabulator jQuery widget
    jQuery(divID).tabulator({
        height: "100%", // set height of table, this enables the Virtual DOM and improves render speed dramatically (can be any valid css height value)
        layout: "fitColumns",
        columnMinWidth: 135,
        pagination: "local",
        paginationSize: 20,
        columns: [ //Define Table Columns
            // { title: "Block", field: "block", sorter: "number", width: 50 },
            { title: "Date", field: "date", sorter: "string", width: 150 },
            { title: "From", field: "from", sorter: "string", width: 50 },
            { title: "Direction", field: "direction", sorter: "string", width: 50 },
            { title: "To", field: "to", sorter: "string", width: 50 },
            { title: "Value (" + currency + ")", field: "value", sorter: "number", width: 50 },
            { title: "TxCost (" + currency + ")", field: "txcost", sorter: "number", width: 50 },
            { title: "TxHash", field: "txhash", sorter: "number", formatter: "html", width: 100 },
        ],
        initialSort: [
            { column: "date", dir: "desc" }, //sort by date
        ]
    });

    //load data into the table
    jQuery(divID).tabulator("setData", tableData);

} // generateNormalTXTable

// Generates the 6 column table shown on Etherscan for internal transactions, but is sortable/filterable
function generateInternalTXTable(divID, internalTXData, address, convfactor, currency) {

    // break if no data
    if (internalTXData == null) {
        return
    }

    // create object to hold table data
    const tableData = []

    // add transactions to tableData array
    for (let i = 0; i < internalTXData.value.length; i++) {
        // get direction of transaction
        if (internalTXData.from[i].toUpperCase() == address.toUpperCase()) {
            var direction = 'Sent'
        } else if (internalTXData.to[i].toUpperCase() == address.toUpperCase()) {
            var direction = 'Received'
        }

        // configure Etherscan hyperlink to txhash
        const txhash = internalTXData.hash[i]
        const txhashlink = "https://etherscan.io/tx/" + txhash
        const txhashhtml = "<a href=\"" + txhashlink + "\"target=\"_blank\">" + txhash + "</a>"

        // push data to tableData array
        tableData.push({
            id: i + 1,
            // txhash: internalTXData.hash[i],
            // block: internalTXData.blockNumber[i],
            date: utilities.formatDate(internalTXData, i),
            from: internalTXData.from[i],
            direction: direction,
            to: internalTXData.to[i],
            value: utilities.convert(convfactor, internalTXData.value[i]).toLocaleString(),
            txhash: txhashhtml
        })
    }

    // Generate table
    // Turn element into a Tabulator by passing a constructor object to the tabulator jQuery widget
    jQuery(divID).tabulator({
        height: "100%", // set height of table, this enables the Virtual DOM and improves render speed dramatically (can be any valid css height value)
        layout: "fitColumns",
        columnMinWidth: 135,
        pagination: "local",
        paginationSize: 20,
        columns: [ //Define Table Columns
            // { title: "Block", field: "block", sorter: "number", width: 50 },
            { title: "Date", field: "date", sorter: "string", width: 150 },
            { title: "From", field: "from", sorter: "string", width: 50 },
            { title: "Direction", field: "direction", sorter: "string", width: 50 },
            { title: "To", field: "to", sorter: "string", width: 50 },
            { title: "Value (" + currency + ")", field: "value", sorter: "number", width: 50 },
            { title: "TxHash", field: "txhash", sorter: "number", formatter: "html", width: 100 },
        ],
        initialSort: [
            { column: "date", dir: "desc" }, //sort by date
        ]
    });

    //load data into the table
    jQuery(divID).tabulator("setData", tableData);

} // generateInternalTXTable
