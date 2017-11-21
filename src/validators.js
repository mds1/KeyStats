// Validation functions

// Change outline color of input box if user enters an invalid address
export function changeInputBoxOutline(isValid) {
    jQuery("#addressInput").change(function () {

        // If address is invalid, add a red border. Otherwise, make it green
        if (isValid) {
            jQuery("#addressInput").css("border", "thin solid green");

        } else {
            jQuery("#addressInput").css("border", "thin solid red");
        }

    }).trigger("change"); // end change function
} // end changeInputBoxOutline


// Determine if an Ethereum address is valid
export function isValidETHAddress(address) {
    //    source: https://ethereum.stackexchange.com/questions/1374/how-can-i-check-if-an-ethereum-address-is-valid
    //    that source links to Geth: https://github.com/ethereum/go-ethereum/blob/aa9fff3e68b1def0a9a22009c233150bf9ba481f/jsre/ethereum_js.go
    if (!/^0x[0-9a-f]{40}$/i.test(address)) {
        // check if it has the basic requirements of an address
        return false;

    } else if (/^0x[0-9a-f]{40}$/.test(address) || /^0x[0-9A-F]{40}$/.test(address)) {
        // If it's all small caps or all caps, return true
        return true;

    } else {
        // Otherwise check if it is a checksum address
        return isValidChecksumETHAddress(address);
    }
} // end isValidETHAddress


// Determine if an Ethereum address is valid checksum address
export function isValidChecksumETHAddress(address) {
    //    source: https://ethereum.stackexchange.com/questions/1374/how-can-i-check-if-an-ethereum-address-is-valid
    //    that source links to Geth: https://github.com/ethereum/go-ethereum/blob/aa9fff3e68b1def0a9a22009c233150bf9ba481f/jsre/ethereum_js.go

    // Check each case
    // address = address.replace('0x','');
    // var addressHash = sha3(address.toLowerCase());
    // for (var i = 0; i < 40; i++ ) {
    //     // the nth letter should be uppercase if the nth digit of casemap is 1
    //     if ((parseInt(addressHash[i], 16) > 7 && address[i].toUpperCase() !== address[i]) || (parseInt(addressHash[i], 16) <= 7 && address[i].toLowerCase() !== address[i])) {
    //         return false;
    //     }
    // }
    return true;
}; // end isValidChecksumETHAddress