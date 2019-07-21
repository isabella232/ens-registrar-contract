pragma solidity 0.5.8;

interface IClock {
  function getTime() view external returns (uint256);
}