const EthvaultENSRegistrar = artifacts.require('EthvaultENSRegistrar');

const MAINNET_ENS_REGISTRY_ADDRESS = '0x314159265dd8dbb310642f98f50c066173c1259b';
const MAINNET_ENS_PUBLIC_RESOLVER_ADDRESS = '0xD3ddcCDD3b25A8a7423B5bEe360a42146eb4Baf3';

module.exports = function (deployer, network, accounts) {
  deployer.deploy(EthvaultENSRegistrar, MAINNET_ENS_REGISTRY_ADDRESS, MAINNET_ENS_PUBLIC_RESOLVER_ADDRESS);
};
