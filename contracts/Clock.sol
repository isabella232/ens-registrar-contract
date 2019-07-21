pragma solidity 0.5.8;

import "./IClock.sol";

contract Clock is IClock {
  function getTime() view public returns (uint256) {
    return block.timestamp;
  }
}