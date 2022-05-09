// SPDX-License-Identifier: Unlicensed
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/// @title GovernanceTokenMock
/// @author Jakub Szymański
/// @notice This is simple mock for testing purposes.
/// @dev This is the simplest implementation of Wrapped Ethereum.
contract ERC20GovernanceTokenMock is IERC20Metadata, ERC20 {
    constructor(string memory name_, string memory symbol_)
        ERC20(name_, symbol_)
    {}

    function deposit() public payable {
        _mint(msg.sender, msg.value);
    }

    function burn(uint256 amount) public {
        _burn(msg.sender, amount);
    }
}
