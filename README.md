# Blockchain Learning Group Inc. Community Hub
## Deploy
0. Ensure client is running
```
$ testrpc

or

parity --chain kovan --rpccorsdomain "*" --warp --unlock 0x00d97ed9c78804dbce8ffd3b7317ad714ededde2,0x0019fE4E0b78f66c767e674F59c466E554c5764a,0x00Da7097facb61d85cD981546741b7f4dB1Eb130,0x00e7d5760069363F59116c9177C069F45ca28D46,0x12b62f69DB8b38f694643eCC917D9B4e9B14cBA4 --password "adamjlemmon_account.file"
```
1. Deploy all contracts.
```
$ truffle migrate
```

2. Update client with most recentl ABIs and addresses for BLG and StaticHub
- app/client/js/home.js
- copy the contents of the build jsons into the top and update the addresses

3. Start the server, add hub and token addresses
```
$ npm run start -- --hub <hubAddress> --blgToken <blgAddress>
```

4. Navigate to url: localhost: 8081

## Populating the hub
1. Add users
- update scripts/addUsers.js by adding all user information you wish to add
```
$ npm run addUsers -- --hub <hubAddress>
```

2. Add resources
- update scripts/addResources.js by adding all resource info you wish to add
```
$ npm run addResources -- --hub <hubAddress>
```

## Client Setup
1. Add ABI and address of the hub
- peg/app/js/home.js
- copy the contents of build/contracts/StaticHub.json into the top and update the address
