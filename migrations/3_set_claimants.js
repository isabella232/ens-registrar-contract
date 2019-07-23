const EthvaultENSRegistrar = artifacts.require('EthvaultENSRegistrar');

const CLAIMANT_ADDRESSES = [
  '0x307bfa815d421ab01e6c93cf5e4fbd88293121ec'
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
        await registrar.removeClaimants(accounts[0]);
      }
    );
  }
};
