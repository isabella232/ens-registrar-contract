pragma solidity >=0.4.22 <0.6.0;

import "@ensdomains/ens/contracts/ENS.sol";
import "@ensdomains/resolver/contracts/Resolver.sol";

contract EthvaultENSRegistrar {
  ENS public ens;
  Resolver public publicResolver;

  // The node corresponding to ethvault.xyz
  bytes32 public rootNode;

  // The addresses that may claim ENS subdomains for the given node
  mapping(address => bool) public allowedClaimants;

  constructor(address _ens, Resolver _publicResolver, bytes32 _rootNode) public {
    ens = ENS(_ens);
    publicResolver = Resolver(_publicResolver);
    rootNode = _rootNode;

    allowedClaimants[msg.sender] = true;
  }

  // Only one of the claimants may call a function.
  modifier claimantOnly() {
    if (!allowedClaimants[msg.sender]) {
      revert("unauthorized - must be from claimant");
    }

    _;
  }

  // Add claimants to the set.
  function addClaimants(address[] calldata claimants) external claimantOnly {
    for (uint i = 0; i < claimants.length; i++) {
      allowedClaimants[claimants[i]] = true;
    }
  }

  // Remove claimants from the set.
  function removeClaimants(address[] calldata claimants) external claimantOnly {
    for (uint i = 0; i < claimants.length; i++) {
      allowedClaimants[claimants[i]] = false;
    }
  }

  /**
   * Register a subdomain name, sets the resolver, updates the resolver, and sets the address of the resolver to the
   * new owner.
   * @param labels The hashes of the label to register
   * @param owners The addresses of the new owners
   */
  function register(bytes32[] calldata labels, address[] calldata owners) external claimantOnly {
    if (labels.length != owners.length) {
      revert("must pass the same number of labels and owners");
    }

    for (uint i = 0; i < owners.length; i++) {
      bytes32 label = labels[i];
      address owner = owners[i];

      // First set it to this, so we can update it.
      ens.setSubnodeOwner(rootNode, label, address(this));

      // Compute the subnode hash
      bytes32 subnode = keccak256(abi.encodePacked(rootNode, label));

      // Set the resolver for the subnode to the public resolver
      ens.setResolver(subnode, address(publicResolver));

      // Set the address to the owner in the public resolver
      publicResolver.setAddr(subnode, owner);

      // Finally pass ownership to the new owner.
      ens.setSubnodeOwner(rootNode, label, owner);
    }
  }

}
