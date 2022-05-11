//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.4;

// import "hardhat/console.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./GovernanceUtils.sol";
import "../lib/StringManipulation.sol";
import "hardhat/console.sol";

contract Governor {
    //Libraries
    using Counters for Counters.Counter;
    using StringManipulation for string;
    //Interfaces
    IERC20 public iVotes;
    //Constants
    //----------------------------------
    //Variables
    address public legislator;
    Counters.Counter private _proposalCounter;
    mapping(uint256 => Proposal) public idToProposal;
    mapping(address => mapping(uint256 => Vote)) public addressToVote;
    mapping(address => mapping(uint256 => bool)) public addressToisVoted;
    //Error declaration
    string private _governorAddressString;
    mapping(string => string) public errorMessage;

    constructor(address administrator_, address votesAddress) {
        //Actors definition
        iVotes = IERC20(votesAddress);
        legislator = administrator_;
        //Error definition
        _governorAddressString = StringManipulation.addressToAsciiString(
            address(this)
        );
        _governorAddressString = StringManipulation.concatenate(
            "Governor at: 0x",
            _governorAddressString
        );
        errorMessage["_createProposal_1"] = StringManipulation.concatenate(
            _governorAddressString,
            " | _createProposal() function | Error message: 'Only legislator can create a proposal.'"
        );
        errorMessage["_createProposal_2"] = StringManipulation.concatenate(
            _governorAddressString,
            " | _createProposal() function | Error message: 'Minimal percentage for approval can not be lower maximal percentage for denial.'"
        );
        errorMessage["_createProposal_3"] = StringManipulation.concatenate(
            _governorAddressString,
            " | _createProposal() function | Error message: 'Percentage values must be in range <0, 100>.'"
        );
        errorMessage["_createProposal_4"] = StringManipulation.concatenate(
            _governorAddressString,
            " | _createProposal() function | Error message: 'Start of voting period has to be before end of the voting period.'"
        );
        errorMessage["vote_1"] = StringManipulation.concatenate(
            _governorAddressString,
            " | vote() function | Error message: 'You have already voted.'"
        );
        errorMessage["vote_2"] = StringManipulation.concatenate(
            _governorAddressString,
            " | vote() function | Error message: 'Voting period has not started yet.'"
        );
        errorMessage["vote_3"] = StringManipulation.concatenate(
            _governorAddressString,
            " | vote() function | Error message: 'Voting period is over.'"
        );
    }

    modifier onlyLegislator() {
        require(msg.sender == legislator, errorMessage["_createProposal_1"]);
        _;
    }

    modifier timestampValidator(uint256 start, uint256 end) {
        require(start < end, errorMessage["_createProposal_4"]);
        _;
    }

    function createProposal(
        uint256 minVotesAmount_,
        uint128 startTimestamp_,
        uint128 endTimestamp_,
        uint8 minPassPercentage_,
        uint8 maxRejectedPercentage_
    )
        external
        onlyLegislator
        timestampValidator(startTimestamp_, endTimestamp_)
        returns (bool)
    {
        require(
            minPassPercentage_ >= maxRejectedPercentage_,
            errorMessage["_createProposal_2"]
        );
        require(minPassPercentage_ <= 100, errorMessage["_createProposal_3"]);

        _proposalCounter.increment();

        idToProposal[_proposalCounter.current()] = Proposal({
            proposalId: _proposalCounter.current(),
            minVotesAmount: minVotesAmount_,
            minPassPercentage: minPassPercentage_,
            maxRejectedPercentage: maxRejectedPercentage_,
            startTimestamp: startTimestamp_,
            endTimestamp: endTimestamp_,
            acceptedVotes: 0,
            againstVotes: 0,
            abstainVotes: 0,
            result: Result.NOT_RESOLVED
        });
        return true;
    }

    function vote(uint256 proposalId_, Vote vote_) external returns (bool) {
        require(
            !addressToisVoted[msg.sender][proposalId_],
            errorMessage["vote_1"]
        );
        require(
            block.timestamp >= idToProposal[proposalId_].startTimestamp,
            errorMessage["vote_2"]
        );
        require(
            block.timestamp <= idToProposal[proposalId_].endTimestamp,
            errorMessage["vote_3"]
        );
        addressToisVoted[msg.sender][proposalId_] = true;

        uint256 votesAmount = iVotes.balanceOf(msg.sender);

        if (vote_ == Vote.AGAINST) {
            idToProposal[proposalId_].againstVotes += votesAmount;
        } else if (vote_ == Vote.ABSTAIN) {
            idToProposal[proposalId_].abstainVotes += votesAmount;
        } else {
            idToProposal[proposalId_].acceptedVotes += votesAmount;
        }
        _calculateResult(proposalId_);

        return true;
    }

    function _calculateResult(uint256 id) internal {
        uint256 total = idToProposal[id].acceptedVotes +
            idToProposal[id].againstVotes +
            idToProposal[id].abstainVotes;

        uint256 passPercentage = ((idToProposal[id].acceptedVotes * 100) /
            total);
        uint256 rejectionPercentage = (idToProposal[id].againstVotes * 100) /
            total;

        if (total >= idToProposal[id].minVotesAmount) {
            if (rejectionPercentage >= idToProposal[id].maxRejectedPercentage) {
                idToProposal[id].result = Result.REJECTED;
            } else if (passPercentage >= idToProposal[id].minPassPercentage) {
                idToProposal[id].result = Result.ACCEPTED;
            } else {
                idToProposal[id].result = Result.NOT_RESOLVED;
            }
        } else {
            idToProposal[id].result = Result.NOT_RESOLVED;
        }
    }

    function setMinVotesAmount(uint256 id, uint256 minVotesAmount_)
        external
        onlyLegislator
        returns (bool)
    {
        idToProposal[id].minVotesAmount = minVotesAmount_;
        _calculateResult(id);
        return true;
    }

    function setMinPassPercentage(uint256 id, uint256 minPassPercentage_)
        external
        onlyLegislator
        returns (bool)
    {
        idToProposal[id].minPassPercentage = minPassPercentage_;
        _calculateResult(id);
        return true;
    }

    function setMaxRejectedPercentage(
        uint256 id,
        uint256 maxRejectedPercentage_
    ) external onlyLegislator returns (bool) {
        idToProposal[id].maxRejectedPercentage = maxRejectedPercentage_;
        _calculateResult(id);
        return true;
    }

    function setStartTimestamp(uint256 id, uint256 startTimestamp_)
        external
        onlyLegislator
        timestampValidator(startTimestamp_, idToProposal[id].endTimestamp)
        returns (bool)
    {
        idToProposal[id].startTimestamp = startTimestamp_;
        return true;
    }

    function setEndTimestamp(uint256 id, uint256 endTimestamp_)
        external
        onlyLegislator
        timestampValidator(idToProposal[id].startTimestamp, endTimestamp_)
        returns (bool)
    {
        idToProposal[id].endTimestamp = endTimestamp_;
        return true;
    }

    function getSummaryOf(uint256 id)
        external
        view
        returns (Summary memory summary)
    {
        summary = Summary(
            idToProposal[id].acceptedVotes,
            idToProposal[id].againstVotes,
            idToProposal[id].abstainVotes,
            idToProposal[id].result
        );
    }
}
