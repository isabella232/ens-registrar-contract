pragma solidity 0.5.8;

import "./EthvaultENSRegistrar.sol";
import "./FakeClock.sol";

// Overrides the clock for testing.
contract TestEthvaultENSRegistrar is EthvaultENSRegistrar, FakeClock {
  constructor(ENS _ens, Resolver _publicResolver, bytes32 _rootNode) EthvaultENSRegistrar(_ens, _publicResolver, _rootNode) public {}
}
