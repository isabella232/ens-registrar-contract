const EthvaultENSRegistrar = artifacts.require('TestEthvaultENSRegistrar');
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
    await fifsRegistrar.register(utils.sha3('ethvault'), contract.address, {from: deployer});
  });

  it('is deployed', async () => {
    assert.equal(typeof contract.address, 'string');
  });

  it('is the owner of the ethvault node', async () => {
    assert.equal(await ens.owner(ETHVAULT_NAME_HASH), contract.address);
  });


  describe('claimants', async () => {
    it('sender is claimant', async () => {
      assert.equal(await contract.isClaimant(deployer), true);
    });

    it('sender can add claimant', async () => {
      await contract.addClaimants([claimant0, claimant1]);
      assert.equal(await contract.isClaimant(claimant0), true);
      assert.equal(await contract.isClaimant(claimant1), true);
      assert.equal(await contract.isClaimant(account0), false);
    });

    it('sender can remove claimant', async () => {
      await contract.addClaimants([claimant0, claimant1]);
      assert.equal(await contract.isClaimant(claimant0), true);
      await contract.removeClaimants([claimant0]);
      assert.equal(await contract.isClaimant(claimant0), false);
    });

    describe('authorization', async () => {
      beforeEach(async () => {
        await contract.addClaimants([claimant0, claimant1]);
      });

      async function expectAuthError(func) {
        let failed = false;
        try {
          await func();
        } catch (error) {
          assert.equal(error.message.indexOf('must be from claimant') !== -1, true);
          failed = true;
        }

        assert.equal(failed, true);
      }

      it('non-claimants cannot call addClaimants', async () => {
        await expectAuthError(() => contract.addClaimants([account0], {from: account0}));
      });

      it('claimants can call addClaimants', async () => {
        await contract.addClaimants([account0], {from: claimant1});
      });

      it('claimants can call removeClaimants', async () => {
        await contract.removeClaimants([claimant0], {from: claimant1});
      });

      it('non-claimants cannot can call removeClaimants', async () => {
        await expectAuthError(() => contract.removeClaimants([claimant0], {from: account0}));
      });

      it('claimants can call claim', async () => {
        await contract.claim([MOODY_LABEL], [account0], {from: claimant0});
      });

      it('non-claimants cannot call claim', async () => {
        await expectAuthError(() => contract.claim([MOODY_LABEL], [account0], {from: account0}));
      });
    });
  });

  describe('claim', () => {
    beforeEach(async () => {
      await contract.addClaimants([claimant0, claimant1]);
    });

    it('sets the owner', async () => {
      await contract.claim([MOODY_LABEL], [account0], {from: claimant0});
      assert.equal(await ens.owner(MOODY_ETHVAULT_NODE), account0);
    });

    it('sets the resolver to the public resolver', async () => {
      await contract.claim([MOODY_LABEL], [account0], {from: claimant0});
      assert.equal(await ens.resolver(MOODY_ETHVAULT_NODE), publicResolver.address);
    });

    it('sets the resolution in the public resolver', async () => {
      await contract.claim([MOODY_LABEL], [account0], {from: claimant0});
      assert.equal(await publicResolver.addr(MOODY_ETHVAULT_NODE), account0);
    });
  });

});
