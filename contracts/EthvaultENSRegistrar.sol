pragma solidity 0.5.8;

import "@ensdomains/ens/contracts/ENS.sol";
import "@ensdomains/resolver/contracts/Resolver.sol";

// This registrar allows a set of claimant addresses to alias any subnode to an address.
contract EthvaultENSRegistrar {
  ENS public ens;
  Resolver public publicResolver;

  // The node corresponding to ethvault.xyz
  bytes32 public rootNode;

  // The addresses that may claim ENS subdomains for the given node
  mapping(address => bool) public isClaimant;

  constructor(ENS _ens, Resolver _publicResolver, bytes32 _rootNode) public {
    ens = _ens;
    publicResolver = _publicResolver;
    rootNode = _rootNode;

    isClaimant[msg.sender] = true;
  }

  // Only one of the claimants may call a function.
  modifier claimantOnly() {
    if (!isClaimant[msg.sender]) {
      revert("unauthorized - must be from claimant");
    }

    _;
  }

  // Set the resolver in ENS to the public resolver contract. Used when the ENS root node owner is set to this registrar
  // but the public resolver is not set as the resolver.
  function setResolver() external claimantOnly {
    ens.setResolver(rootNode, address(publicResolver));
  }

  // Add claimants to the set.
  function addClaimants(address[] calldata claimants) external claimantOnly {
    for (uint i = 0; i < claimants.length; i++) {
      isClaimant[claimants[i]] = true;
    }
  }

  // Remove claimants from the set.
  function removeClaimants(address[] calldata claimants) external claimantOnly {
    for (uint i = 0; i < claimants.length; i++) {
      isClaimant[claimants[i]] = false;
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
