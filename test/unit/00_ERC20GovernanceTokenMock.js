const { expect } = require("chai");
const { ethers } = require("hardhat");
const { ETHER } = require("../utils/TestUtils");

describe("Test WETH", function () {
    let addr1;
    let addr2;
    let addrs;

    beforeEach(async () => {
        const WETH = await ethers.getContractFactory("ERC20GovernanceTokenMock");
        wETH = await WETH.deploy("Wrapped Ether DioMEDe", "WETHD");
        await wETH.deployed();

        [owner, addr1, addr2, ...addrs] = await ethers.getSigners();
    });

    describe("deposit()", function () {
        it("PASS", async () => {
            await wETH.connect(addr1).deposit({ value: ETHER[1] });

            expect(await wETH.balanceOf(addr1.address)).equals(ETHER[1]);
        });
    });

    describe("fallback()", function () {
        it("PASS", async () => {
            await wETH.connect(addr1).fallback({ value: ETHER[1] });

            expect(await wETH.balanceOf(addr1.address)).equals(ETHER[1]);
        });
    });

    describe("receive()", function () {
        it("PASS", async () => {
            await owner.sendTransaction({
                to: wETH.address,
                value: ETHER[1],
            });

            expect(await wETH.balanceOf(owner.address)).equals(ETHER[1]);
        });
    });

    describe("withdraw()", function () {
        it("PASS", async () => {
            await wETH.connect(addr1).deposit({ value: ETHER[2] });

            expect(await wETH.balanceOf(addr1.address)).to.equal(ETHER[2]);

            await wETH.connect(addr1).withdraw(ETHER[1]);

            expect(await wETH.balanceOf(addr1.address)).equals(ETHER[1]);
        });

        it("FAIL - too small balance", async () => {
            await wETH.connect(addr1).deposit({ value: ETHER[1] });

            expect(await wETH.balanceOf(addr1.address)).to.equal(ETHER[1]);

            await expect(wETH.connect(addr1).withdraw({ value: ETHER[2] })).to.be.reverted;
        });
    });
});