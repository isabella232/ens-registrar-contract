pragma solidity 0.5.8;

import "./EthvaultENSRegistrar.sol";
import "./FakeClock.sol";

// Overrides the clock for testing.
contract TestEthvaultENSRegistrar is EthvaultENSRegistrar, FakeClock {
  constructor(ENS _ens) EthvaultENSRegistrar(_ens) public {}
}
