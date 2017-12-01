// Entry point

// import other JS files
import * as validators from "./validators.js";
import * as utilities from "./utilities.js";
import * as api from "./api.js";
import * as figures from "./figures.js";

// import CSS files
import './style.css';
import './tabulator.css';
import './tippy.css';

// Configure site to allow for getting address info via URL instead of search box
// First check URL for an ETH address, and if it contains an address, use that
// window.onload = function () {
//     if (window.location.search.length > 40) {
//         // save off address
//         var address = window.location.search.replace(/[^a-z0-9]/gi, ''); // sanitize address
//         // load main page
//         jQuery("#addressInput").val(address)
//         jQuery('#addressForm').submit();
//     }
// }


window.onload = function () {
    if (window.location.search.length == 43) {
        // sanitize address in URL
        var address = window.location.search.replace(/[^a-z0-9]/gi, '');
        // populate input box
        jQuery("#addressInput").val(address);
        // submit form
        // jQuery('#addressForm').submit(function (event) {
        // event.preventDefault();
        // });
        jQuery('#addressForm').submit();
        jQuery('#addressForm').on('submit', search)
    }
}


// Once the page has loaded, do everything
jQuery(document).ready(function ($) {

    // Add page break so footer reaches the bottom -- this might be obsolete now after footer updates
    jQuery('#LoadingIcon').html("<br><br><br>");


    // Add tooltip for caveats
    tippy('.caveats', {
        theme: 'dark',
        arrow: true,

    })

    // Register 'submit' handler of <form> element of index.html, then call search function
    $('#addressForm').on('submit', search)

});


async function search(event) {
    // Show loading icon
    jQuery('#LoadingIcon').html("");
    jQuery('#LoadingIcon').html("<h3><i style=\"color:white\" class=\"fa fa-spinner fa-pulse fa-3x\" aria-hidden=\"true\"></i></h3>");

    // A <form> refreshes the page when data is submitted, so preventDefault() prevents this
    event.preventDefault();

    // hide keyboard on mobile by taking focus away from search box
    jQuery('#addressInput').blur();

    // Assign the entered address to a variable
    const enteredString = jQuery('#addressInput').val();

    // Remove all non-alphanumeric characters
    const address = enteredString.replace(/[^a-z0-9]/gi, ''); // sanitize address

    // Run main function
    main(address)
}

async function main(address) {

    // Clear any existing figures/tables/headers
    jQuery("#horiz1").empty();
    jQuery("#horiz2").empty();
    jQuery("#horiz3").empty();
    jQuery("#horiz4").empty();
    jQuery("#balance").empty();
    jQuery("#NumAndQtyOfSentAndRecTX").empty();
    jQuery("#accountBalanceVsTime").empty();
    jQuery("#scatterOfTXValue").empty();
    jQuery("#boxPlotOfTXValue").empty();
    jQuery("#histogramOfTXValue").empty();
    jQuery("#totalGasCostVsTime").empty();
    jQuery("#scatterOfTXCost").empty();
    jQuery("#boxPlotOfTXCost").empty();
    jQuery("#frequencyTitle").empty();
    jQuery("#TXValueTitle").empty();
    jQuery("#TXCostTitle").empty();
    jQuery("#normalTXtitle").empty();
    jQuery("#internalTXtitle").empty();
    utilities.removeExistingTable("#tableOfSentAddressFrequency");
    utilities.removeExistingTable("#tableOfReceivedAddressFrequency");
    utilities.removeExistingTable("#tableOfNormalTXData");
    utilities.removeExistingTable("#tableOfInternalTXData");

    // Check that the address is valid
    const isValid = validators.isValidETHAddress(address);

    // Highlight input box accordingly and output text if address is invalid
    validators.changeInputBoxOutline(isValid)

    if (!isValid) {
        jQuery('#LoadingIcon').html(""); // clear loading icon
        jQuery('#horiz1').html('<hr>');
        jQuery('#balance').html('<p>Invalid Address Entered</p>');
        jQuery('#horiz2').html('<hr>');
        return
    } else {
        // change URL

    }

    // Get currency selected, or use ETH as default
    if (jQuery('#currencyDropdown').val() == undefined) {
        var currency = 'ETH'
    } else {
        var currency = jQuery('#currencyDropdown').val();
    }

    // Call All APIs
    const APIData = await api.callAPIs(address, isValid, currency)
    const balanceData = APIData[0].status == "1" ? APIData[0].result : null
    const normalTXData = APIData[1].status == "1" ? APIData[1].result : null
    const internalTXData = APIData[2].status == "1" ? APIData[2].result : null;
    const convfactor = APIData[3][0]['price_' + currency.toLowerCase()] / 1e18; // get conversion factor from Wei to selected currency

    // Take call from balance API, convert from Wei to Ether, then display result
    const accountBalance = utilities.convert(convfactor, balanceData);
    utilities.displayBalanceResults(accountBalance, currency)

    // Reformat and merge normal and internal transaction data, and reformat the normal/internal TX data to match this structure
    const allData = utilities.mergeNormalAndInternalTXData(normalTXData, internalTXData)
    const allTXData = allData[0];
    const refNormalTXData = allData[1];
    const refInternalTXData = allData[2];

    // Parse transaction data -- returns array where indices 0/1/2 = stats total/sent/received
    let statsM = utilities.parseTransactionData(address, allTXData) // merged normal/internal stats
    let statsN = utilities.parseTransactionData(address, refNormalTXData) // normal stats (for tx costs)

    // Calculate statistics -- returns array where indices 0/1/2 = stats total/sent/received
    statsM = utilities.calculateStatistics(address, statsM, statsN)

    // Generate figures, tables, and plots
    jQuery('#horiz3').html('<hr>');
    jQuery('#horiz4').html('<hr>');
    figures.generateFigures(...statsM, refNormalTXData, refInternalTXData, address, convfactor, currency)

    // Hide loading image
    jQuery('#LoadingIcon').html("");
}

// QUESTIONS:
// 1. How to configure site with JS so entering an address in the URL computes data, and can be linked to?

// EVENTUALLY:
// 1. Add support for  multiple address (with choice to sum results or compare them)
// 2. Change angle of text when floating over box plot
