const EthvaultENSRegistrar = artifacts.require('EthvaultENSRegistrar');
const ENSRegistry = artifacts.require('@ensdomains/ens/contracts/ENSRegistry');
const FIFSRegistrar = artifacts.require('@ensdomains/ens/contracts/FIFSRegistrar');
const ReverseRegistrar = artifacts.require('@ensdomains/ens/contracts/ReverseRegistrar');
const PublicResolver = artifacts.require('@ensdomains/resolver/contracts/PublicResolver');
const TestDependencies = artifacts.require('TestDependencies');


const utils = require('web3-utils');
const namehash = require('eth-ens-namehash');

const ETHVAULT_NAME_HASH = namehash.hash('ethvault.xyz');

const MOODY_ETHVAULT_NODE = namehash.hash('moody.ethvault.xyz');
const MOODY_LABEL = utils.sha3('moody');

contract('EthvaultENSRegistrar', function ([deployer, claimant0, claimant1, account0, account1, account2]) {
  let contract;
  let testDependencies;
  let ens;
  let fifsRegistrar;
  let reverseRegistrar;
  let publicResolver;

  beforeEach('set up test dependencies', async () => {
    testDependencies = await TestDependencies.new({from: deployer});
    ens = await ENSRegistry.at(await testDependencies.ens());
    fifsRegistrar = await FIFSRegistrar.at(await testDependencies.fifsRegistrar());
    reverseRegistrar = await ReverseRegistrar.at(await testDependencies.reverseRegistrar());
    publicResolver = await PublicResolver.at(await testDependencies.publicResolver());
  });

  beforeEach('deploy contract', async () => {
    contract = await EthvaultENSRegistrar.new(ens.address, publicResolver.address, ETHVAULT_NAME_HASH, {from: deployer});

    // Set the owner of the ethvault label to the contract
    await fifsRegistrar.register(utils.sha3('ethvault'), contract.address);
  });

  it('is deployed', async () => {
    assert.equal(typeof contract.address, 'string');
  });

  it('sender is claimant', async () => {
    assert.equal(await contract.isClaimant(deployer), true);
  });

  describe('#setResolver', () => {
    it('sets the resolver in ens to the public resolver', async () => {
      await contract.setResolver({from: deployer});
    });
  });
});
