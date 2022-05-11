const { expect } = require("chai");
const exp = require("constants");
const { ethers } = require("hardhat");
const { ETHER, delay } = require("../utils/TestUtils");

describe("Test Governor", function () {
    let owner;
    let addr1;
    let addr2;
    let addrs;

    let enumVote = {
        ACCEPT: 0,
        AGAINST: 1,
        ABSTAIN: 2
    }
    let enumResult = {
        ACCEPTED: 0,
        REJECTED: 1,
        NOT_RESOLVED: 2
    }

    let keys = [
        "_createProposal_1",
        "_createProposal_2",
        "_createProposal_3",
        "_createProposal_4",
        "vote_1",
        "vote_2",
        "vote_3"
    ];
    let errors = [
        " | _createProposal() function | Error message: 'Only legislator can create a proposal.'",
        " | _createProposal() function | Error message: 'Minimal percentage for approval can not be lower maximal percentage for denial.'",
        " | _createProposal() function | Error message: 'Percentage values must be in range <0, 100>.'",
        " | _createProposal() function | Error message: 'Start of voting period has to be before end of the voting period.'",
        " | vote() function | Error message: 'You have already voted.'",
        " | vote() function | Error message: 'Voting period has not started yet.'",
        " | vote() function | Error message: 'Voting period is over.'"
    ];

    beforeEach(async () => {
        const WETH = await ethers.getContractFactory("ERC20GovernanceTokenMock");
        wETH = await WETH.deploy("Wrapped Ether", "WETH");
        await wETH.deployed();

        [owner, addr1, addr2, ...addrs] = await ethers.getSigners();

        await wETH.connect(owner).deposit({ value: ETHER[10] });
        await wETH.connect(addr1).deposit({ value: ETHER[25] });
        await wETH.connect(addr2).deposit({ value: ETHER[50] });

        const StringManipulation = await ethers.getContractFactory("StringManipulation");
        stringManipulation = await StringManipulation.deploy();
        await stringManipulation.deployed();

        const Governor = await ethers.getContractFactory("Governor", {
            libraries: {
                StringManipulation: stringManipulation.address
            }
        });
        governor = await Governor.deploy(owner.address, wETH.address);
        await governor.deployed();
    });

    describe("Test constructor()", function () {
        it("PASS", async () => {
            expect(await governor.legislator()).to.equal(owner.address);
            expect(await governor.iVotes()).to.equal(wETH.address);

            for (i = 0; i < keys.length; i++) {
                let errorMessage = "Governor at: " + String(governor.address).toLowerCase() + errors[i];
                expect(await governor.errorMessage(keys[i])).to.equal(errorMessage);
            }
        });
    });

    describe("Test createProposal()", function () {
        it("PASS", async () => {
            date = Math.floor(Date.now() / 1000);
            createProposal_Tx = await governor.connect(owner).createProposal(
                ETHER[10],
                date,
                date + 60,
                70,
                30
            );
            proposal = await governor.idToProposal(1);

            expect(proposal.proposalId).to.equal(1);
            expect(proposal.minVotesAmount).to.equal(ETHER[10]);
            expect(proposal.minPassPercentage).to.equal(70);
            expect(proposal.maxRejectedPercentage).to.equal(30);
            expect(proposal.startTimestamp).to.equal(date);
            expect(proposal.endTimestamp).to.equal(date + 60);
            expect(proposal.acceptedVotes).to.equal(0);
            expect(proposal.againstVotes).to.equal(0);
            expect(proposal.abstainVotes).to.equal(0);
            expect(proposal.result).to.equal(2);
        });

        it("FAIL - Wrong address", async () => {
            date = Math.floor(Date.now() / 1000);
            await expect(governor.connect(addr1).createProposal(
                ETHER[10],
                date,
                date + 60,
                70,
                30
            )).to.be.revertedWith(
                "Governor at: " +
                String(governor.address).toLowerCase() +
                errors[0]);
        });

        it("FAIL - Pass percentage < rejection percentage", async () => {
            date = Math.floor(Date.now() / 1000);
            await expect(governor.connect(owner).createProposal(
                ETHER[10],
                date,
                date + 60,
                30,
                70
            )).to.be.revertedWith(
                "Governor at: " +
                String(governor.address).toLowerCase() +
                errors[1]);
        });

        it("FAIL - Pass percentage above 100", async () => {
            date = Math.floor(Date.now() / 1000);
            await expect(governor.connect(owner).createProposal(
                ETHER[10],
                date,
                date + 60,
                101,
                30
            )).to.be.revertedWith(
                "Governor at: " +
                String(governor.address).toLowerCase() +
                errors[2]);
        });

        it("FAIL - Start timestamp > end timestamp", async () => {
            date = Math.floor(Date.now() / 1000);
            await expect(governor.connect(owner).createProposal(
                ETHER[10],
                date + 60,
                date,
                70,
                30
            )).to.be.revertedWith(
                "Governor at: " +
                String(governor.address).toLowerCase() +
                errors[3]);
        });
    });

    describe("Test vote()", function () {
        it("PASS", async () => {
            date = Math.floor(Date.now() / 1000);
            createProposal_Tx = await governor.connect(owner).createProposal(
                ETHER[15],
                date,
                date + 100,
                70,
                30
            );
            voteOwner_Tx = await governor.connect(owner).vote(1, enumVote["ABSTAIN"]);
            proposal = await governor.idToProposal(1);
            expect(proposal.abstainVotes).to.equal(ETHER[10]);
            expect(proposal.result).to.equal(enumResult["NOT_RESOLVED"]);

            voteAddr2_Tx = await governor.connect(addr2).vote(1, enumVote["ACCEPT"]);
            proposal = await governor.idToProposal(1);
            expect(proposal.acceptedVotes).to.equal(ETHER[50]);
            expect(proposal.result).to.equal(enumResult["ACCEPTED"]);

            deposit_Tx = await wETH.connect(addr1).deposit({ value: ETHER[70] })
            voteAddr1_Tx = await governor.connect(addr1).vote(1, enumVote["AGAINST"]);
            proposal = await governor.idToProposal(1);
            expect(proposal.result).to.equal(enumResult["REJECTED"]);
        });

        it("FAIL - Attempt to vote again ", async () => {
            date = Math.floor(Date.now() / 1000);
            createProposal_Tx = await governor.connect(owner).createProposal(
                ETHER[10],
                date,
                date + 100,
                70,
                30
            );

            voteOwner_Tx = await governor.connect(owner).vote(1, enumVote["ACCEPT"]);
            proposal = await governor.idToProposal(1);
            expect(proposal.acceptedVotes).to.equal(ETHER[10]);

            let errorMessage = "Governor at: " + String(governor.address).toLowerCase() + errors[4];
            await expect(governor.connect(owner).vote(1, enumVote["AGAINST"]))
                .to.be.revertedWith(errorMessage);
        });

        it("FAIL - Voting before start of voting period", async () => {
            date = Math.floor(Date.now() / 1000);
            createProposal_Tx = await governor.connect(owner).createProposal(
                ETHER[10],
                date + 1000,
                date + 10000,
                70,
                30
            );

            let errorMessage = "Governor at: " + String(governor.address).toLowerCase() + errors[5];
            await expect(governor.connect(owner).vote(1, enumVote["AGAINST"]))
                .to.be.revertedWith(errorMessage);
        });

        it("FAIL - Voting after end of voting period", async () => {
            date = Math.floor(Date.now() / 1000);
            createProposal_Tx = await governor.connect(owner).createProposal(
                ETHER[10],
                date,
                date + 1,
                70,
                30
            );

            await delay(1.1);

            let errorMessage = "Governor at: " + String(governor.address).toLowerCase() + errors[6];
            await expect(governor.connect(owner).vote(1, enumVote["AGAINST"]))
                .to.be.revertedWith(errorMessage);
        });
    });

    describe("Test setMinVotesAmount()", function () {
        it("PASS", async () => {
            date = Math.floor(Date.now() / 1000);
            createProposal_Tx = await governor.connect(owner).createProposal(
                ETHER[9],
                date,
                date + 1000,
                70,
                30
            );

            voteOwner_Tx = await governor.connect(owner).vote(1, enumVote["ACCEPT"]);
            proposal = await governor.idToProposal(1);
            expect(proposal.minVotesAmount).to.equal(ETHER[9]);
            expect(proposal.result).to.equal(enumResult["ACCEPTED"]);

            changeMinVotes_Tx = await governor.setMinVotesAmount(1, ETHER[11]);
            proposal = await governor.idToProposal(1);
            expect(proposal.minVotesAmount).to.equal(ETHER[11]);
            expect(proposal.result).to.equal(enumResult["NOT_RESOLVED"]);
        });

        it("FAIL - Wrong Address", async () => {
            date = Math.floor(Date.now() / 1000);
            createProposal_Tx = await governor.connect(owner).createProposal(
                ETHER[9],
                date,
                date + 1000,
                70,
                30
            );

            voteOwner_Tx = await governor.connect(owner).vote(1, enumVote["ACCEPT"]);
            proposal = await governor.idToProposal(1);
            expect(proposal.minVotesAmount).to.equal(ETHER[9]);
            expect(proposal.result).to.equal(enumResult["ACCEPTED"]);

            let errorMessage = "Governor at: " + String(governor.address).toLowerCase() + errors[0];
            await expect(governor.connect(addr1).setMinVotesAmount(1, ETHER[11])).to.be.revertedWith(errorMessage);
        });
    });

    describe("Test setMinPassPercentage()", function () {
        it("PASS", async () => {
            date = Math.floor(Date.now() / 1000);
            createProposal_Tx = await governor.connect(owner).createProposal(
                ETHER[9],
                date,
                date + 1000,
                70,
                30
            );

            deposit_Tx = await wETH.connect(owner).deposit({ value: ETHER[15] });
            voteOwner_Tx = await governor.connect(owner).vote(1, enumVote["ACCEPT"]);
            proposal = await governor.idToProposal(1);
            expect(proposal.result).to.equal(enumResult["ACCEPTED"]);
            expect(proposal.acceptedVotes).to.equal(ETHER[25]);

            voteAddr1_Tx = await governor.connect(addr1).vote(1, enumVote["ABSTAIN"]);
            proposal = await governor.idToProposal(1);
            expect(proposal.result).to.equal(enumResult["NOT_RESOLVED"]);

            changeMinVotes_Tx = await governor.setMinPassPercentage(1, 40);
            proposal = await governor.idToProposal(1);
            expect(proposal.abstainVotes).to.equal(ETHER[25]);
            expect(proposal.result).to.equal(enumResult["ACCEPTED"]);
        });

        it("FAIL - Wrong Address", async () => {
            date = Math.floor(Date.now() / 1000);
            createProposal_Tx = await governor.connect(owner).createProposal(
                ETHER[9],
                date,
                date + 1000,
                70,
                30
            );

            voteOwner_Tx = await governor.connect(owner).vote(1, enumVote["ACCEPT"]);
            proposal = await governor.idToProposal(1);
            expect(proposal.result).to.equal(enumResult["ACCEPTED"]);

            let errorMessage = "Governor at: " + String(governor.address).toLowerCase() + errors[0];
            await expect(governor.connect(addr1).setMinPassPercentage(1, 90)).to.be.revertedWith(errorMessage);
        });
    });

    describe("Test setMaxRejectedPercentage()", function () {
        it("PASS", async () => {
            date = Math.floor(Date.now() / 1000);
            createProposal_Tx = await governor.connect(owner).createProposal(
                ETHER[9],
                date,
                date + 1000,
                70,
                30
            );

            voteOwner_Tx = await governor.connect(owner).vote(1, enumVote["AGAINST"]);
            proposal = await governor.idToProposal(1);
            expect(proposal.result).to.equal(enumResult["REJECTED"]);
            expect(proposal.againstVotes).to.equal(ETHER[10]);

            voteAddr1_Tx = await governor.connect(addr1).vote(1, enumVote["ABSTAIN"]);
            proposal = await governor.idToProposal(1);
            expect(proposal.result).to.equal(enumResult["NOT_RESOLVED"]);

            changeMinVotes_Tx = await governor.setMaxRejectedPercentage(1, 20);
            proposal = await governor.idToProposal(1);
            expect(proposal.abstainVotes).to.equal(ETHER[25]);
            expect(proposal.result).to.equal(enumResult["REJECTED"]);
        });

        it("FAIL - Wrong Address", async () => {
            date = Math.floor(Date.now() / 1000);
            createProposal_Tx = await governor.connect(owner).createProposal(
                ETHER[9],
                date,
                date + 1000,
                70,
                30
            );

            voteOwner_Tx = await governor.connect(owner).vote(1, enumVote["ACCEPT"]);
            proposal = await governor.idToProposal(1);
            expect(proposal.result).to.equal(enumResult["ACCEPTED"]);

            let errorMessage = "Governor at: " + String(governor.address).toLowerCase() + errors[0];
            await expect(governor.connect(addr1).setMaxRejectedPercentage(1, 60)).to.be.revertedWith(errorMessage);
        });
    });

    describe("Test setStartTimestamp()", function () {
        it("PASS", async () => {
            date = Math.floor(Date.now() / 1000);
            createProposal_Tx = await governor.connect(owner).createProposal(
                ETHER[9],
                date,
                date + 1000,
                70,
                30
            );

            voteOwner_Tx = await governor.connect(owner).vote(1, enumVote["AGAINST"]);
            proposal = await governor.idToProposal(1);
            expect(proposal.result).to.equal(enumResult["REJECTED"]);
            expect(proposal.againstVotes).to.equal(ETHER[10]);

            changeMinVotes_Tx = await governor.setStartTimestamp(1, date + 500);
            proposal = await governor.idToProposal(1);
            expect(proposal.startTimestamp).to.equal(date + 500);

            let errorMessage = "Governor at: " + String(governor.address).toLowerCase() + errors[5];
            await expect(governor.connect(addr1).vote(1, enumVote["ABSTAIN"]))
                .to.be.revertedWith(errorMessage);
        });

        it("FAIL - Wrong Address", async () => {
            date = Math.floor(Date.now() / 1000);
            createProposal_Tx = await governor.connect(owner).createProposal(
                ETHER[9],
                date,
                date + 1000,
                70,
                30
            );

            voteOwner_Tx = await governor.connect(owner).vote(1, enumVote["ACCEPT"]);
            proposal = await governor.idToProposal(1);
            expect(proposal.result).to.equal(enumResult["ACCEPTED"]);

            let errorMessage = "Governor at: " + String(governor.address).toLowerCase() + errors[0];
            await expect(governor.connect(addr1).setStartTimestamp(1, 60)).to.be.revertedWith(errorMessage);
        });
    });

    describe("Test setEndTimestamp()", function () {
        it("PASS", async () => {
            date = Math.floor(Date.now() / 1000);
            createProposal_Tx = await governor.connect(owner).createProposal(
                ETHER[9],
                date,
                date + 1000,
                70,
                30
            );

            voteOwner_Tx = await governor.connect(owner).vote(1, enumVote["AGAINST"]);
            proposal = await governor.idToProposal(1);
            expect(proposal.result).to.equal(enumResult["REJECTED"]);
            expect(proposal.againstVotes).to.equal(ETHER[10]);

            changeMinVotes_Tx = await governor.setEndTimestamp(1, date + 5);
            proposal = await governor.idToProposal(1);
            expect(proposal.endTimestamp).to.equal(date + 5);

            let errorMessage = "Governor at: " + String(governor.address).toLowerCase() + errors[6];
            await expect(governor.connect(addr1).vote(1, enumVote["ABSTAIN"]))
                .to.be.revertedWith(errorMessage);
        });

        it("FAIL - Wrong Address", async () => {
            date = Math.floor(Date.now() / 1000);
            createProposal_Tx = await governor.connect(owner).createProposal(
                ETHER[9],
                date,
                date + 1000,
                70,
                30
            );

            voteOwner_Tx = await governor.connect(owner).vote(1, enumVote["ACCEPT"]);
            proposal = await governor.idToProposal(1);
            expect(proposal.result).to.equal(enumResult["ACCEPTED"]);

            let errorMessage = "Governor at: " + String(governor.address).toLowerCase() + errors[0];
            await expect(governor.connect(addr1).setEndTimestamp(1, 60)).to.be.revertedWith(errorMessage);
        });
    });

    describe("Test getSummaryOf()", function () {
        it("PASS", async () => {
            date = Math.floor(Date.now() / 1000);
            createProposal_Tx = await governor.connect(owner).createProposal(
                ETHER[10],
                date,
                date + 60,
                70,
                30
            );
            proposal = await governor.idToProposal(1);
            result = await governor.getSummaryOf(1);
            expect(proposal.acceptedVotes).to.equal(result.acceptedVotes);
            expect(proposal.againstVotes).to.equal(result.againstVotes);
            expect(proposal.abstainVotes).to.equal(result.abstainVotes);
            expect(proposal.result).to.equal(result.result);
        });
    });
});