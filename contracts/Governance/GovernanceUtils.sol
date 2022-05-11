// SPDX-License-Identifier: Unlicensed
pragma solidity ^0.8.4;

struct Proposal {
    uint256 proposalId;
    uint256 minVotesAmount;
    uint256 minPassPercentage;
    uint256 maxRejectedPercentage;
    uint256 startTimestamp;
    uint256 endTimestamp;
    uint256 acceptedVotes;
    uint256 againstVotes;
    uint256 abstainVotes;
    Result result;
}

struct Summary {
    uint256 acceptedVotes;
    uint256 againstVotes;
    uint256 abstainVotes;
    Result result;
}

enum Vote {
    ACCEPTED,
    AGAINST,
    ABSTAIN
}

enum Result {
    ACCEPTED,
    REJECTED,
    NOT_RESOLVED
}
