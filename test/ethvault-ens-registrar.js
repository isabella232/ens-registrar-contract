const EthvaultENSRegistrar = artifacts.require('EthvaultENSRegistrar');

contract('EthvaultENSRegistrar', function (accounts) {
  let contract;

  beforeEach(async () => {
    contract = await EthvaultENSRegistrar.deployed();
  });

  it('is deployed', async () => {
    assert.equal(typeof contract.address, 'string');
  });
});
