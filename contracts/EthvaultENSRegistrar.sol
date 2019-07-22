pragma solidity 0.5.8;

import "@ensdomains/ens/contracts/ENS.sol";
import "@ensdomains/resolver/contracts/Resolver.sol";
import "./ECRecovery.sol";
import "./Clock.sol";

// This registrar allows a set of claimant addresses to alias any subnode to an address.
contract EthvaultENSRegistrar is Clock {
  // Emitted when a user is registered
  event Registration(address claimant, bytes32 label, address owner, uint256 value);

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

  function namehash(bytes32 label) view public returns (bytes32) {
    return keccak256(abi.encodePacked(rootNode, label));
  }

  // Get the data that the user should sign to release a name.
  function getReleaseSignData(bytes32 label, uint256 expirationTimestamp) pure public returns (bytes32) {
    return keccak256(abi.encodePacked(label, expirationTimestamp));
  }

  // Allow a subnode to be released given the user's signature. Anyone can perform this operation as long as the
  // signature has not expired.
  function release(bytes32 label, uint256 expirationTimestamp, bytes calldata signature) external {
    bytes32 subnode = namehash(label);

    address currentOwner = ens.owner(subnode);

    if (currentOwner == address(0)) {
      // No-op, just return.
      return;
    }

    address signer = ECRecovery.recover(
      ECRecovery.toEthSignedMessageHash(getReleaseSignData(label, expirationTimestamp)),
      signature
    );

    if (signer == address(0)) {
      revert("invalid signature");
    }

    if (signer != currentOwner) {
      revert("signature is not from current owner");
    }

    if (expirationTimestamp < getTime()) {
      revert("the signature has expired");
    }

    ens.setSubnodeOwner(rootNode, label, address(0));
  }

  /**
   * Register a subdomain name, sets the resolver, updates the resolver, and sets the address of the resolver to the
   * new owner. Also transfers any additional value to each address.
   * @param labels The hashes of the label to register
   * @param owners The addresses of the new owners
   * @param values The WEI values to send to each address
   */
  function register(bytes32[] calldata labels, address payable[] calldata owners, uint256[] calldata values) external payable claimantOnly {
    if (labels.length != owners.length || owners.length != values.length) {
      revert("must pass the same number of labels and owners");
    }

    uint256 dispersedTotal = 0;

    for (uint i = 0; i < owners.length; i++) {
      bytes32 label = labels[i];
      address payable owner = owners[i];
      uint256 value = values[i];

      // Compute the subnode hash
      bytes32 subnode = namehash(label);

      // Get the current owner of this subnode
      address currentOwner = ens.owner(subnode);

      // Prevent overwriting ownership with a different address
      if (currentOwner != address(0) && currentOwner != owner) {
        revert("the label owner may not be changed");
      }

      // Skip if the current owner is already the owner
      if (currentOwner == owner) {
        continue;
      }

      // First set it to this, so we can update it.
      ens.setSubnodeOwner(rootNode, label, address(this));

      // Set the resolver for the subnode to the public resolver
      ens.setResolver(subnode, address(publicResolver));

      // Set the address to the owner in the public resolver
      publicResolver.setAddr(subnode, owner);

      // Finally pass ownership to the new owner.
      ens.setSubnodeOwner(rootNode, label, owner);

      if (value > 0) {
        dispersedTotal = dispersedTotal + value;
        owner.transfer(value);
      }

      emit Registration(msg.sender, label, owner, value);
    }

    if (dispersedTotal < msg.value) {
      msg.sender.transfer(msg.value - dispersedTotal);
    }
  }

}
