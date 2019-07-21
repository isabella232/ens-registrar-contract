const EthvaultENSRegistrar = artifacts.require('EthvaultENSRegistrar');

const ENS_ADDRESSES = {
  mainnet: {
    ens: '0x314159265dd8dbb310642f98f50c066173c1259b',
    publicResolver: '0xD3ddcCDD3b25A8a7423B5bEe360a42146eb4Baf3'
  },
  ropsten: {
    ens: '0x112234455c3a32fd11230c42e7bccd4a84e02010'
    // TODO: get the public resolver address from the ENS registry
  }
};

const namehash = require('eth-ens-namehash');

const ETHVAULT_XYZ_NODE = namehash.hash('ethvault.xyz');

module.exports = function (deployer, network, accounts) {
  if (network in ENS_ADDRESSES) {
    const {ens, publicResolver} = ENS_ADDRESSES[network];

    deployer.deploy(
      EthvaultENSRegistrar,
      ens,
      publicResolver,
      ETHVAULT_XYZ_NODE
    );
  }
};
