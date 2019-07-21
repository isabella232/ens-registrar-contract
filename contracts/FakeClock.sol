pragma solidity 0.5.8;

import "./IClock.sol";

contract FakeClock is IClock {
  uint256 public time;

  function setTime(uint256 _time) public {
    time = _time;
  }

  function getTime() view public returns (uint256) {
    return time;
  }
}