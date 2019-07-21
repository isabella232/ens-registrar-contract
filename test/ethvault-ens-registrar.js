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
const BOB_LABEL = utils.sha3('bob');

async function expectError(func, expectedMessage) {
  let failed = false;
  try {
    await func();
  } catch (error) {
    assert.equal(error.message.indexOf(expectedMessage) !== -1, true);
    failed = true;
  }

  assert.equal(failed, true);
}

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

      const expectAuthError = func => expectError(func, 'must be from claimant');

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

      it('claimants can call register', async () => {
        await contract.register([MOODY_LABEL], [account0], {from: claimant0});
      });

      it('non-claimants cannot call register', async () => {
        await expectAuthError(() => contract.register([MOODY_LABEL], [account0], {from: account0}));
      });
    });
  });

  describe('register', () => {
    beforeEach('add claimants', async () => {
      await contract.addClaimants([claimant0, claimant1]);
    });

    it('sets the owner', async () => {
      await contract.register([MOODY_LABEL], [account0], {from: claimant0});
      assert.equal(await ens.owner(MOODY_ETHVAULT_NODE), account0);
    });

    it('sets the resolver to the public resolver', async () => {
      await contract.register([MOODY_LABEL], [account0], {from: claimant0});
      assert.equal(await ens.resolver(MOODY_ETHVAULT_NODE), publicResolver.address);
    });

    it('sets the resolution in the public resolver', async () => {
      await contract.register([MOODY_LABEL], [account0], {from: claimant0});
      assert.equal(await publicResolver.addr(MOODY_ETHVAULT_NODE), account0);
    });

    it('validates the number of labels is the number of owners', async () => {
      await expectError(() => contract.register([], [account0], {from: claimant0}), 'must pass the same number of labels and owners');
    });

    it('zero addresses is no op', async () => {
      await contract.register([], [], {from: claimant0});
    });

    it('does not throw on overwrite with same address', async () => {
      await contract.register([MOODY_LABEL], [account0], {from: claimant0});
      await contract.register([MOODY_LABEL], [account0], {from: claimant1});
    });

    it('cannot overwrite existing labels with different addresses', async () => {
      await contract.register([MOODY_LABEL], [account0], {from: claimant0});
      await expectError(() => contract.register([MOODY_LABEL], [account1], {from: claimant0}), 'the label owner may not be changed');
    });
  });

  describe('release', () => {
    const CURRENT_TIME = 100;

    beforeEach('add claimants', async () => {
      await contract.addClaimants([claimant0, claimant1]);
    });

    beforeEach('register the moody label', async () => {
      await contract.register([MOODY_LABEL], [account0], {from: claimant0});
    });

    beforeEach('set current time', async () => {
      await contract.setTime(CURRENT_TIME);
    });

    it('sets the subnode owner to address 0');
    it('can be called by anyone');

    // "the signature has expired"
    it('cannot be called if the timestamp expires');
    // "signature is not from current owner"
    it('cannot be called if the signature is invalid');

    it('is no op if already released', async () => {
      const fakeSignature = utils.sha3('fake');
      await contract.release(BOB_LABEL, 0, fakeSignature, {from: account0});
    });
  });

});
