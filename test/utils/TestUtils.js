const { ethers } = require("hardhat");

list = [];

for (let i = 0; i < 1001; i++) {
    list[i] = ethers.utils.parseEther(String(i));
}

function delay(n) {
    return new Promise(function (resolve) {
        setTimeout(resolve, n * 1000);
    });
}

module.exports = {
    delay: delay,
    ETHER: list,
    SOL_PRINT: false
};