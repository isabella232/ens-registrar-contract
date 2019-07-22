const ECRecovery = artifacts.require('ECRecovery');
const EthvaultENSRegistrar = artifacts.require('EthvaultENSRegistrar');

const ENS_ADDRESSES = {
  mainnet: {
    ens: '0x314159265dd8dbb310642f98f50c066173c1259b'
  },
  ropsten: {
    ens: '0x112234455c3a32fd11230c42e7bccd4a84e02010'
  }
};

const namehash = require('eth-ens-namehash');

const ETHVAULT_XYZ_NODE = namehash.hash('ethvault.xyz');

module.exports = function (deployer, network, accounts) {
  if (network in ENS_ADDRESSES) {
    const {ens} = ENS_ADDRESSES[network];

    deployer.deploy(ECRecovery);
    deployer.link(ECRecovery, EthvaultENSRegistrar);
    deployer.deploy(
      EthvaultENSRegistrar,
      ens,
      ETHVAULT_XYZ_NODE
    );
  }
};
