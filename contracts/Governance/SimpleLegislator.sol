// SPDX-License-Identifier: Unlicensed
pragma solidity ^0.8.4;

import "./SimpleGovernor.sol";

contract SimpleLegislator {
    SimpleGovernor public governor;

    constructor() {
        governor = new SimpleGovernor();
    }

    function createProposal() external returns (bool) {
        return governor._createProposal();
    }
}
