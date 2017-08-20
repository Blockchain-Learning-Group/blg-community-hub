const HUB_ADDRESS = '0x1fe7163b34e7023ae7808608d85cf9e9f38f6188'

// Import the page's CSS. Webpack will know what to do with it.
import "./css/app.css";

// Import libraries we need.
import { default as Web3} from 'web3';
import { default as contract } from 'truffle-contract'

// Import our contract artifacts and turn them into usable abstractions.
import hubArtifacts from '../build/contracts/StaticHub.json'
const Hub = contract(hubArtifacts);

async function init() {
  await Hub.setProvider(web3.currentProvider);

  /* NOTE does not liek .deployed() ??? */
  const hub = await Hub.at(HUB_ADDRESS)
  const res = await hub.getUint.call()
  console.log(res)
  console.log(res.toNumber())
  console.log(res.toNumber() === 1)
}



// window.App = {
//    start: function() {}
// };


window.addEventListener('load', function() {
  window.web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));

  init()
  // App.start();
});
