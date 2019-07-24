const EthvaultENSRegistrar = artifacts.require('EthvaultENSRegistrar');

const CLAIMANT_ADDRESSES = [
  '0xa34203df6244140d93f0925c415b089ff9aef20b'
];

const CLAIMANTS_BY_NETWORK = {
  mainnet: {
    claimants: CLAIMANT_ADDRESSES
  },
  ropsten: {
    claimants: CLAIMANT_ADDRESSES
  },
  rinkeby: {
    claimants: CLAIMANT_ADDRESSES
  },
  goerli: {
    claimants: CLAIMANT_ADDRESSES
  }
};

module.exports = function (deployer, network, accounts) {
  if (network.endsWith('-fork')) {
    network = network.substring(0, network.lastIndexOf('-fork'));
  }

  if (network in CLAIMANTS_BY_NETWORK) {
    deployer.then(
      async () => {
        const registrar = await EthvaultENSRegistrar.deployed();

        await registrar.addClaimants(CLAIMANTS_BY_NETWORK[network].claimants);
        await registrar.removeClaimants([accounts[0]]);
      }
    );
  }
};
