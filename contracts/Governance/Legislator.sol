// SPDX-License-Identifier: Unlicensed
pragma solidity ^0.8.4;

import "./Governor.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract Legislator is Ownable {
    Governor public governor;

    constructor(address votesAddress_) {
        governor = new Governor(address(this), votesAddress_);
    }

    function createProposal(
        uint256 minVotesAmount_,
        uint128 startTimestamp_,
        uint128 endTimestamp_,
        uint8 minPassPercentage_,
        uint8 maxRejectedPercentage_
    ) external onlyOwner returns (bool) {
        return
            governor.createProposal(
                minVotesAmount_,
                startTimestamp_,
                endTimestamp_,
                minPassPercentage_,
                maxRejectedPercentage_
            );
    }

    function setMinVotesAmount(uint256 id, uint256 minVotesAmount_)
        external
        onlyOwner
        returns (bool)
    {
        return governor.setMinVotesAmount(id, minVotesAmount_);
    }

    function setMinPassPercentage(uint256 id, uint256 minPassPercentage_)
        external
        onlyOwner
        returns (bool)
    {
        return governor.setMinPassPercentage(id, minPassPercentage_);
    }

    function setMaxRejectedPercentage(
        uint256 id,
        uint256 maxRejectedPercentage_
    ) external onlyOwner returns (bool) {
        return governor.setMaxRejectedPercentage(id, maxRejectedPercentage_);
    }

    function setStartTimestamp(uint256 id, uint256 startTimestamp_)
        external
        onlyOwner
        returns (bool)
    {
        return governor.setStartTimestamp(id, startTimestamp_);
    }

    function setEndTimestamp(uint256 id, uint256 endTimestamp_)
        external
        onlyOwner
        returns (bool)
    {
        return governor.setEndTimestamp(id, endTimestamp_);
    }
}
