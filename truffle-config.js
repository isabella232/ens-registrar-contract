const HDWalletProvider = require('truffle-hdwallet-provider');

const INFURA_PROJECT_ID = process.env.INFURA_PROJECT_ID;
const SIGNING_PRIVATE_KEY = process.env.SIGNING_PRIVATE_KEY;

module.exports = {
  networks: {
    mainnet: {
      network_id: '1',
      gas: 5000000,
      provider: () => 
        new HDWalletProvider(
          SIGNING_PRIVATE_KEY,
          `https://mainnet.infura.io/v3/${INFURA_PROJECT_ID}`
        )
    },

    ropsten: {
      network_id: '3',
      gas: 5000000,
      provider: () => 
        new HDWalletProvider(
          SIGNING_PRIVATE_KEY,
          `https://ropsten.infura.io/v3/${INFURA_PROJECT_ID}`
        )
    },

    rinkeby: {
      network_id: '4',
      gas: 5000000,
      provider: () => 
        new HDWalletProvider(
          SIGNING_PRIVATE_KEY,
          `https://rinkeby.infura.io/v3/${INFURA_PROJECT_ID}`
        )
    },

    goerli: {
      network_id: '5',
      gas: 5000000,
      provider: () => 
        new HDWalletProvider(
          SIGNING_PRIVATE_KEY,
          `https://goerli.infura.io/v3/${INFURA_PROJECT_ID}`
        )
    },
  },
  compilers: {
    solc: {
      settings: {
        optimizer: {
          enabled: true,
          runs: 200
        }
      }
    }
  }
};
