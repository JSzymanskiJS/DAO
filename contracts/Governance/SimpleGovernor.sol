//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/utils/Counters.sol";
import "./GovernanceUtils.sol";

contract SimpleGovernor {
    using Counters for Counters.Counter;

    address public legislator;
    address public administrator;
    Counters.Counter private _proposalCounter;
    mapping(uint256 => Proposal) public idToProposal;
    mapping(address => mapping(uint256 => Vote)) public addressToVote;

    constructor(address administrator_) {
        legislator = msg.sender;
        administrator = administrator_;
    }

    function _createProposal(uint16 minVotesAmount_, uint16 minPassPercentage_)
        public
        returns (bool)
    {
        require(
            msg.sender == legislator,
            "Only legislator can create a proposal!"
        );
        _proposalCounter.increment();
        idToProposal[_proposalCounter.current()] = Proposal({
            proposalId: _proposalCounter.current(),
            minVotesAmount: minVotesAmount_,
            minPassPercentage: minPassPercentage_,
            startTimestamp: block.timestamp,
            endTimestamp: 0,
            forVotes: 0,
            againstVotes: 0,
            abstainVotes: 0,
            result: Result.NOT_RESOLVED
        });
        return true;
    }
}
