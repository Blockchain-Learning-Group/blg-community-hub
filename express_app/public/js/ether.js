// Local Dev client connection
const web3 = new Web3(
  new Web3.providers.HttpProvider('http://localhost:8545')
);

// Deploy on Kovan testnet via infura
// const web3 = new Web3(
//   new Web3.providers.HttpProvider('https://kovan.infura.io/thMAdMI5QeIf8dirn63U')
// );

console.log(web3);
console.log('Connected: ' + web3.isConnected());
console.log('Latest block number: ' + web3.eth.blockNumber);
console.log('Available accounts: ');
console.log(web3.eth.accounts);
