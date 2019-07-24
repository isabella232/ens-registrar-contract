const EthvaultENSRegistrar = artifacts.require('TestEthvaultENSRegistrar');
const ENSRegistry = artifacts.require('@ensdomains/ens/contracts/ENSRegistry');
const FIFSRegistrar = artifacts.require('@ensdomains/ens/contracts/FIFSRegistrar');
const ReverseRegistrar = artifacts.require('@ensdomains/ens/contracts/ReverseRegistrar');
const PublicResolver = artifacts.require('@ensdomains/resolver/contracts/PublicResolver');
const TestDependencies = artifacts.require('TestDependencies');
const BigNumber = require('bignumber.js');

const utils = require('web3-utils');
const namehash = require('eth-ens-namehash');

const ETHVAULT_NAME_HASH = namehash.hash('ethvault.xyz');

const MOODY_ETHVAULT_NODE = namehash.hash('moody.ethvault.xyz');
const MOODY_LABEL = utils.sha3('moody');
const BOB_ETHVAULT_NODE = namehash.hash('bob.ethvault.xyz');
const BOB_LABEL = utils.sha3('bob');

async function expectError(func, expectedMessage) {
  let failed = false;
  try {
    await func();
  } catch (error) {
    assert.equal(error.message.indexOf(expectedMessage) !== -1, true, `expected to find "${expectedMessage}" in "${error.message}"`);
    failed = true;
  }

  assert.equal(failed, true, `expected to throw but did not throw`);
}

contract('EthvaultENSRegistrar', function ([deployer, claimant0, claimant1, account0, account1]) {
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
    contract = await EthvaultENSRegistrar.new(ens.address, ETHVAULT_NAME_HASH, {from: deployer});

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
        await contract.register([MOODY_LABEL], [account0], [0], {from: claimant0});
      });

      it('non-claimants cannot call register', async () => {
        await expectAuthError(() => contract.register([MOODY_LABEL], [account0], [0], {from: account0}));
      });
    });
  });

  describe('register', () => {
    beforeEach('add claimants', async () => {
      await contract.addClaimants([claimant0, claimant1]);
    });

    it('sets the owner', async () => {
      await contract.register([MOODY_LABEL], [account0], [0], {from: claimant0});
      assert.equal(await ens.owner(MOODY_ETHVAULT_NODE), account0);
    });

    it('sets the resolver to the public resolver', async () => {
      await contract.register([MOODY_LABEL], [account0], [0], {from: claimant0});
      assert.equal(await ens.resolver(MOODY_ETHVAULT_NODE), publicResolver.address);
    });

    it('sets the resolution in the public resolver', async () => {
      await contract.register([MOODY_LABEL], [account0], [0], {from: claimant0});
      assert.equal(await publicResolver.addr(MOODY_ETHVAULT_NODE), account0);
    });

    it('works in bulk', async () => {
      await contract.register([MOODY_LABEL, BOB_LABEL], [account0, account1], [0, 0], {from: claimant0});
      assert.equal(await publicResolver.addr(MOODY_ETHVAULT_NODE), account0);
      assert.equal(await publicResolver.addr(BOB_ETHVAULT_NODE), account1);
    });

    it('validates each argument has the same length', async () => {
      await expectError(
        () => contract.register([], [account0], [], {from: claimant0}),
        'must pass the same number of labels and owners'
      );

      await expectError(
        () => contract.register([MOODY_LABEL], [], [], {from: claimant0}),
        'must pass the same number of labels and owners'
      );

      await expectError(
        () => contract.register([], [], [0], {from: claimant0}),
        'must pass the same number of labels and owners'
      );

      await expectError(
        () => contract.register([MOODY_LABEL], [account0], [], {from: claimant0}),
        'must pass the same number of labels and owners'
      );

      await expectError(
        () => contract.register([], [account0], [0], {from: claimant0}),
        'must pass the same number of labels and owners'
      );

      await expectError(
        () => contract.register([MOODY_LABEL], [], [0], {from: claimant0}),
        'must pass the same number of labels and owners'
      );
    });

    it('allows sending some value', async () => {
      const balance = await web3.eth.getBalance(account0);
      await contract.register([MOODY_LABEL], [account0], [10], {from: claimant0, value: 10});
      const diff = new BigNumber(await web3.eth.getBalance(account0)).minus(balance);
      assert.equal(diff.toString(), '10');
    });

    it('allows sending value to multiple', async () => {
      const a0balance = await web3.eth.getBalance(account0);
      const a1balance = await web3.eth.getBalance(account1);

      await contract.register([MOODY_LABEL, BOB_LABEL], [account0, account1], [6, 4], {from: claimant0, value: 10});

      const a0diff = new BigNumber(await web3.eth.getBalance(account0)).minus(a0balance);
      const a1diff = new BigNumber(await web3.eth.getBalance(account1)).minus(a1balance);

      assert.equal(a0diff.toString(), 6);
      assert.equal(a1diff.toString(), 4);
    });

    it('throws without enough value', async () => {
      await expectError(
        () =>
          contract.register([MOODY_LABEL, BOB_LABEL], [account0, account1], [6, 4], {from: claimant0, value: 9}),
        'revert'
      );
    });

    it('returns any excess value', async () => {
      const oldBalance = await web3.eth.getBalance(claimant0);
      const tx = await contract.register([MOODY_LABEL, BOB_LABEL], [account0, account1], [6, 4], {
        from: claimant0,
        value: 20,
        gasPrice: 0
      });
      const difference = new BigNumber(oldBalance).minus(await web3.eth.getBalance(claimant0));
      assert.equal(difference.toString(), '10');
    });

    it('skips sending value to already registered labels', async () => {
      await contract.register([MOODY_LABEL], [account0], [0], {from: claimant0});

      const oldBalance = await web3.eth.getBalance(claimant0);
      const tx = await contract.register([MOODY_LABEL, BOB_LABEL], [account0, account1], [6, 4], {
        from: claimant0,
        value: 10,
        gasPrice: 0
      });
      const difference = new BigNumber(oldBalance).minus(await web3.eth.getBalance(claimant0));
      assert.equal(difference.toString(), '4');
    });

    it('zero addresses is no op', async () => {
      await contract.register([], [], [], {from: claimant0});
    });

    it('does not throw on overwrite with same address', async () => {
      await contract.register([MOODY_LABEL], [account0], [0], {from: claimant0});
      await contract.register([MOODY_LABEL], [account0], [0], {from: claimant1});
    });

    it('cannot overwrite existing labels with different addresses', async () => {
      await contract.register([MOODY_LABEL], [account0], [0], {from: claimant0});
      await expectError(() => contract.register([MOODY_LABEL], [account1], [0], {from: claimant0}), 'the label owner may not be changed');
    });
  });

  describe('release', () => {
    const CURRENT_TIME = 100;

    async function sign(label, timestamp, from) {
      const signableData = await contract.getReleaseSignData(label, timestamp);

      return web3.eth.sign(signableData, from);
    }

    beforeEach('add claimants', async () => {
      await contract.addClaimants([claimant0, claimant1]);
    });

    beforeEach('register the moody label', async () => {
      await contract.register([MOODY_LABEL], [account0], [0], {from: claimant0});
    });

    beforeEach('set current time', async () => {
      await contract.setTime(CURRENT_TIME);
    });

    it('sets the subnode owner to address 0', async () => {
      const validSignature = await sign(MOODY_LABEL, 120, account0);

      await contract.release(MOODY_LABEL, 120, validSignature, {from: account0});

      assert.equal(/^0x0{40}$/.test(await ens.owner(MOODY_ETHVAULT_NODE)), true);
    });

    it('can be called by anyone', async () => {
      const validSignature = await sign(MOODY_LABEL, 120, account0);

      await contract.release(MOODY_LABEL, 120, validSignature, {from: account1});
    });

    it('cannot be called if the timestamp is before now', async () => {
      const validSignature = await sign(MOODY_LABEL, 99, account0);

      await expectError(
        () => contract.release(MOODY_LABEL, 99, validSignature),
        'the signature has expired'
      );
    });

    it('cannot be called if the signature is invalid', async () => {
      const validSignatureWrongSigner = await sign(MOODY_LABEL, 120, account1);

      await expectError(
        () => contract.release(MOODY_LABEL, 120, validSignatureWrongSigner),
        'signature is not from current owner'
      );
    });

    it('is no op if already released', async () => {
      const fakeSignature = utils.sha3('fake');
      await contract.release(BOB_LABEL, 0, fakeSignature, {from: account0});
    });
  });

});
