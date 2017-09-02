let web3
let hub
let blgToken
const listenerEventCallbacks = {
  'LogResourceAdded': resourceAddedCb,
  'LogUserAdded': userAddedCb,
  'LogErrorString': errorStringCb,
  'LogTokensMinted': tokensMintedCb,
  'LogActivated': blgTokenActivatedCb
}

// Ugly contract data for ease, rquired for events!
const staticHub = {
  "contract_name": "StaticHub",
  "abi": [
    {
      "constant": false,
      "inputs": [
        {
          "name": "_resourceUrl",
          "type": "string"
        }
      ],
      "name": "addResource",
      "outputs": [
        {
          "name": "",
          "type": "bool"
        }
      ],
      "payable": false,
      "type": "function"
    },
    {
      "constant": true,
      "inputs": [
        {
          "name": "_id",
          "type": "bytes32"
        }
      ],
      "name": "getResourceById",
      "outputs": [
        {
          "name": "",
          "type": "string"
        },
        {
          "name": "",
          "type": "address"
        },
        {
          "name": "",
          "type": "uint256"
        },
        {
          "name": "",
          "type": "uint256"
        }
      ],
      "payable": false,
      "type": "function"
    },
    {
      "constant": false,
      "inputs": [
        {
          "name": "_userEOA",
          "type": "address"
        },
        {
          "name": "_userName",
          "type": "string"
        },
        {
          "name": "_position",
          "type": "string"
        },
        {
          "name": "_location",
          "type": "string"
        }
      ],
      "name": "addUser",
      "outputs": [
        {
          "name": "",
          "type": "bool"
        }
      ],
      "payable": false,
      "type": "function"
    },
    {
      "constant": true,
      "inputs": [],
      "name": "getResourceIds",
      "outputs": [
        {
          "name": "",
          "type": "bytes32[]"
        }
      ],
      "payable": false,
      "type": "function"
    },
    {
      "constant": true,
      "inputs": [],
      "name": "getAllUsers",
      "outputs": [
        {
          "name": "",
          "type": "address[]"
        }
      ],
      "payable": false,
      "type": "function"
    },
    {
      "constant": true,
      "inputs": [
        {
          "name": "_user",
          "type": "address"
        }
      ],
      "name": "getUserData",
      "outputs": [
        {
          "name": "",
          "type": "string"
        },
        {
          "name": "",
          "type": "string"
        },
        {
          "name": "",
          "type": "string"
        }
      ],
      "payable": false,
      "type": "function"
    },
    {
      "inputs": [
        {
          "name": "_blgToken",
          "type": "address"
        }
      ],
      "payable": false,
      "type": "constructor"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": false,
          "name": "user",
          "type": "address"
        },
        {
          "indexed": false,
          "name": "resourceUrl",
          "type": "string"
        },
        {
          "indexed": false,
          "name": "blockNumber",
          "type": "uint256"
        }
      ],
      "name": "LogResourceAdded",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": false,
          "name": "user",
          "type": "address"
        }
      ],
      "name": "LogUserAdded",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": false,
          "name": "errorString",
          "type": "string"
        }
      ],
      "name": "LogErrorString",
      "type": "event"
    }
  ],
  "unlinked_binary": "0x6060604052341561000c57fe5b604051602080610b7b83398101604052515b604080517fc63dffcd000000000000000000000000000000000000000000000000000000008152600060048201819052600160a060020a0384166024830152915173__HubInterface__________________________9263c63dffcd9260448082019391829003018186803b151561009257fe5b6102c65a03f415156100a057fe5b5050505b505b610ac6806100b56000396000f3006060604052361561005c5763ffffffff60e060020a6000350416638a15309b811461005e578063bc8a6f201461008d578063c6361c221461014c578063dff836e1146101a0578063e2842d791461020b578063ffc9896b14610276575bfe5b341561006657fe5b61007960048035602481019101356103f9565b604080519115158252519081900360200190f35b341561009557fe5b6100a0600435610495565b604051808060200185600160a060020a0316600160a060020a0316815260200184815260200183815260200182810382528681815181526020019150805190602001908083836000831461010f575b80518252602083111561010f57601f1990920191602091820191016100ef565b505050905090810190601f16801561013b5780820380516001836020036101000a031916815260200191505b509550505050505060405180910390f35b341561015457fe5b61007960048035600160a060020a031690602480358082019290810135916044358082019290810135916064359081019101356105c5565b604080519115158252519081900360200190f35b34156101a857fe5b6101b06106be565b60408051602080825283518183015283519192839290830191858101910280838382156101f8575b8051825260208311156101f857601f1990920191602091820191016101d8565b5050509050019250505060405180910390f35b341561021357fe5b6101b061071b565b60408051602080825283518183015283519192839290830191858101910280838382156101f8575b8051825260208311156101f857601f1990920191602091820191016101d8565b5050509050019250505060405180910390f35b341561027e57fe5b610292600160a060020a0360043516610781565b604051808060200180602001806020018481038452878181518152602001915080519060200190808383600083146102e5575b8051825260208311156102e557601f1990920191602091820191016102c5565b505050905090810190601f1680156103115780820380516001836020036101000a031916815260200191505b5084810383528651815286516020918201918801908083838215610350575b80518252602083111561035057601f199092019160209182019101610330565b505050905090810190601f16801561037c5780820380516001836020036101000a031916815260200191505b50848103825285518152855160209182019187019080838382156103bb575b8051825260208311156103bb57601f19909201916020918201910161039b565b505050905090810190601f1680156103e75780820380516001836020036101000a031916815260200191505b50965050505050505060405180910390f35b6000600073__HubInterface__________________________63b495af6b909185856000604051602001526040518463ffffffff1660e060020a02815260040180848152602001806020018281038252848482818152602001925080828437820191505094505050505060206040518083038186803b151561047757fe5b6102c65a03f4151561048557fe5b5050604051519150505b92915050565b61049d6109ca565b6000600060006104ab6109dc565b6000868152600360209081526040918290208251815460026000196001831615610100020190911604601f8101849004909302810160c090810190945260a081018381529093919284928491908401828280156105495780601f1061051e57610100808354040283529160200191610549565b820191906000526020600020905b81548152906001019060200180831161052c57829003601f168201915b50505091835250506001820154600160a060020a03166020820152600282015460408201526003808301546060830152600483015460809092019160ff169081111561059157fe5b600381111561059c57fe5b90525080516020820151604083015160608401519298509096509450925090505b509193509193565b6000600073__HubInterface__________________________63c1aad72690918a8a8a8a8a8a8a6000604051602001526040518963ffffffff1660e060020a0281526004018089815260200188600160a060020a0316600160a060020a0316815260200180602001806020018060200184810384528a8a82818152602001925080828437909101858103845288815260200190508888808284379091018581038352868152602001905086868082843782019150509b50505050505050505050505060206040518083038186803b151561069b57fe5b6102c65a03f415156106a957fe5b5050604051519150505b979650505050505050565b6106c66109ca565b600280546040805160208084028201810190925282815292919083018282801561071057602002820191906000526020600020905b815481526001909101906020018083116106fb575b505050505090505b90565b6107236109ca565b600480546040805160208084028201810190925282815292919083018282801561071057602002820191906000526020600020905b8154600160a060020a03168152600190910190602001808311610758575b505050505090505b90565b6107896109ca565b6107916109ca565b6107996109ca565b6107a1610a49565b600160a060020a0385166000908152600560209081526040918290208251815460026001821615610100026000190190911604601f8101849004909302810160a0908101909452608081018381529093919284928491908401828280156108495780601f1061081e57610100808354040283529160200191610849565b820191906000526020600020905b81548152906001019060200180831161082c57829003601f168201915b50505050508152602001600182018054600181600116156101000203166002900480601f0160208091040260200160405190810160405280929190818152602001828054600181600116156101000203166002900480156108eb5780601f106108c0576101008083540402835291602001916108eb565b820191906000526020600020905b8154815290600101906020018083116108ce57829003601f168201915b5050509183525050600282810180546040805160206001841615610100026000190190931694909404601f8101839004830285018301909152808452938101939083018282801561097d5780601f106109525761010080835404028352916020019161097d565b820191906000526020600020905b81548152906001019060200180831161096057829003601f168201915b505050918352505060038281015460209092019160ff169081111561099e57fe5b60038111156109a957fe5b9052508051602082015160408301519196509450925090505b509193909250565b60408051602081019091526000815290565b60a0604051908101604052806109f06109ca565b81526020016000600160a060020a03168152602001600081526020016000815260200160006003811115610a2057fe5b905290565b60408051602081019091526000815290565b60408051602081019091526000815290565b608060405190810160405280610a5d6109ca565b8152602001610a6a6109ca565b8152602001610a776109ca565b81526020016000610a20565b905290565b604080516020810190915260008152905600a165627a7a723058201e1c647c3b764da67ad6bde4d97b396d1c909ecf602da98e58949e4a476551a00029",
  "networks": {
    "1503344661753": {
      "links": {},
      "events": {},
      "updated_at": 1503347111587
    },
    "1503357420045": {
      "links": {},
      "events": {},
      "updated_at": 1503357436254
    },
    "1503495098194": {
      "links": {},
      "events": {},
      "updated_at": 1503502536993
    },
    "1503605493729": {
      "links": {},
      "events": {
        "0x6afc416b2fe8b6963d76e934b5f184804279bb1f1d0a8b4fb005df5b07540452": {
          "anonymous": false,
          "inputs": [
            {
              "indexed": false,
              "name": "user",
              "type": "address"
            },
            {
              "indexed": false,
              "name": "resourceUrl",
              "type": "string"
            }
          ],
          "name": "LogResourceAdded",
          "type": "event"
        },
        "0x187047b56eb20e7a0313254e37dc60b8c1a9d25707114d2caaaee420b2b7ec23": {
          "anonymous": false,
          "inputs": [
            {
              "indexed": false,
              "name": "user",
              "type": "address"
            }
          ],
          "name": "LogUserAdded",
          "type": "event"
        },
        "0x551303dd5f39cbfe6daba6b3e27754b8a7d72f519756a2cde2b92c2bbde159a7": {
          "anonymous": false,
          "inputs": [
            {
              "indexed": false,
              "name": "errorString",
              "type": "string"
            }
          ],
          "name": "LogErrorString",
          "type": "event"
        }
      },
      "updated_at": 1503619442289
    },
    "1503663160069": {
      "links": {},
      "events": {
        "0x6afc416b2fe8b6963d76e934b5f184804279bb1f1d0a8b4fb005df5b07540452": {
          "anonymous": false,
          "inputs": [
            {
              "indexed": false,
              "name": "user",
              "type": "address"
            },
            {
              "indexed": false,
              "name": "resourceUrl",
              "type": "string"
            }
          ],
          "name": "LogResourceAdded",
          "type": "event"
        },
        "0x187047b56eb20e7a0313254e37dc60b8c1a9d25707114d2caaaee420b2b7ec23": {
          "anonymous": false,
          "inputs": [
            {
              "indexed": false,
              "name": "user",
              "type": "address"
            }
          ],
          "name": "LogUserAdded",
          "type": "event"
        },
        "0x551303dd5f39cbfe6daba6b3e27754b8a7d72f519756a2cde2b92c2bbde159a7": {
          "anonymous": false,
          "inputs": [
            {
              "indexed": false,
              "name": "errorString",
              "type": "string"
            }
          ],
          "name": "LogErrorString",
          "type": "event"
        }
      },
      "updated_at": 1503663177295
    },
    "1503668134525": {
      "links": {},
      "events": {
        "0x6afc416b2fe8b6963d76e934b5f184804279bb1f1d0a8b4fb005df5b07540452": {
          "anonymous": false,
          "inputs": [
            {
              "indexed": false,
              "name": "user",
              "type": "address"
            },
            {
              "indexed": false,
              "name": "resourceUrl",
              "type": "string"
            }
          ],
          "name": "LogResourceAdded",
          "type": "event"
        },
        "0x187047b56eb20e7a0313254e37dc60b8c1a9d25707114d2caaaee420b2b7ec23": {
          "anonymous": false,
          "inputs": [
            {
              "indexed": false,
              "name": "user",
              "type": "address"
            }
          ],
          "name": "LogUserAdded",
          "type": "event"
        },
        "0x551303dd5f39cbfe6daba6b3e27754b8a7d72f519756a2cde2b92c2bbde159a7": {
          "anonymous": false,
          "inputs": [
            {
              "indexed": false,
              "name": "errorString",
              "type": "string"
            }
          ],
          "name": "LogErrorString",
          "type": "event"
        }
      },
      "updated_at": 1503682624703
    },
    "1503690755708": {
      "links": {},
      "events": {
        "0x6afc416b2fe8b6963d76e934b5f184804279bb1f1d0a8b4fb005df5b07540452": {
          "anonymous": false,
          "inputs": [
            {
              "indexed": false,
              "name": "user",
              "type": "address"
            },
            {
              "indexed": false,
              "name": "resourceUrl",
              "type": "string"
            }
          ],
          "name": "LogResourceAdded",
          "type": "event"
        },
        "0x187047b56eb20e7a0313254e37dc60b8c1a9d25707114d2caaaee420b2b7ec23": {
          "anonymous": false,
          "inputs": [
            {
              "indexed": false,
              "name": "user",
              "type": "address"
            }
          ],
          "name": "LogUserAdded",
          "type": "event"
        },
        "0x551303dd5f39cbfe6daba6b3e27754b8a7d72f519756a2cde2b92c2bbde159a7": {
          "anonymous": false,
          "inputs": [
            {
              "indexed": false,
              "name": "errorString",
              "type": "string"
            }
          ],
          "name": "LogErrorString",
          "type": "event"
        },
        "0x413d05b8bb326cef7511810161c97e50e07475497cb0c04dc8b407faf7991ab8": {
          "anonymous": false,
          "inputs": [
            {
              "indexed": false,
              "name": "user",
              "type": "address"
            },
            {
              "indexed": false,
              "name": "resourceUrl",
              "type": "string"
            },
            {
              "indexed": false,
              "name": "blockNumber",
              "type": "uint256"
            }
          ],
          "name": "LogResourceAdded",
          "type": "event"
        }
      },
      "updated_at": 1503698395657
    },
    "1503769219669": {
      "links": {},
      "events": {
        "0x413d05b8bb326cef7511810161c97e50e07475497cb0c04dc8b407faf7991ab8": {
          "anonymous": false,
          "inputs": [
            {
              "indexed": false,
              "name": "user",
              "type": "address"
            },
            {
              "indexed": false,
              "name": "resourceUrl",
              "type": "string"
            },
            {
              "indexed": false,
              "name": "blockNumber",
              "type": "uint256"
            }
          ],
          "name": "LogResourceAdded",
          "type": "event"
        },
        "0x187047b56eb20e7a0313254e37dc60b8c1a9d25707114d2caaaee420b2b7ec23": {
          "anonymous": false,
          "inputs": [
            {
              "indexed": false,
              "name": "user",
              "type": "address"
            }
          ],
          "name": "LogUserAdded",
          "type": "event"
        },
        "0x551303dd5f39cbfe6daba6b3e27754b8a7d72f519756a2cde2b92c2bbde159a7": {
          "anonymous": false,
          "inputs": [
            {
              "indexed": false,
              "name": "errorString",
              "type": "string"
            }
          ],
          "name": "LogErrorString",
          "type": "event"
        }
      },
      "updated_at": 1503769599549
    }
  },
  "schema_version": "0.0.5",
  "updated_at": 1503769599549
}
const staticHubAddress = '0x14b92295da19f849ad1af6345400f8c96e46b7a3'

const blg = {
  "contract_name": "BLG",
  "abi": [
    {
      "constant": false,
      "inputs": [
        {
          "name": "_spender",
          "type": "address"
        },
        {
          "name": "_value",
          "type": "uint256"
        }
      ],
      "name": "approve",
      "outputs": [
        {
          "name": "success",
          "type": "bool"
        }
      ],
      "payable": false,
      "type": "function"
    },
    {
      "constant": true,
      "inputs": [],
      "name": "totalSupply",
      "outputs": [
        {
          "name": "",
          "type": "uint256"
        }
      ],
      "payable": false,
      "type": "function"
    },
    {
      "constant": false,
      "inputs": [
        {
          "name": "_from",
          "type": "address"
        },
        {
          "name": "_to",
          "type": "address"
        },
        {
          "name": "_value",
          "type": "uint256"
        }
      ],
      "name": "transferFrom",
      "outputs": [
        {
          "name": "success",
          "type": "bool"
        }
      ],
      "payable": false,
      "type": "function"
    },
    {
      "constant": true,
      "inputs": [],
      "name": "DECIMALS",
      "outputs": [
        {
          "name": "",
          "type": "uint256"
        }
      ],
      "payable": false,
      "type": "function"
    },
    {
      "constant": true,
      "inputs": [],
      "name": "totalSupply_",
      "outputs": [
        {
          "name": "",
          "type": "uint256"
        }
      ],
      "payable": false,
      "type": "function"
    },
    {
      "constant": false,
      "inputs": [
        {
          "name": "_to",
          "type": "address"
        },
        {
          "name": "_value",
          "type": "uint256"
        }
      ],
      "name": "mint",
      "outputs": [
        {
          "name": "",
          "type": "bool"
        }
      ],
      "payable": false,
      "type": "function"
    },
    {
      "constant": true,
      "inputs": [],
      "name": "active_",
      "outputs": [
        {
          "name": "",
          "type": "bool"
        }
      ],
      "payable": false,
      "type": "function"
    },
    {
      "constant": true,
      "inputs": [
        {
          "name": "",
          "type": "address"
        }
      ],
      "name": "balances_",
      "outputs": [
        {
          "name": "",
          "type": "uint256"
        }
      ],
      "payable": false,
      "type": "function"
    },
    {
      "constant": true,
      "inputs": [
        {
          "name": "_owner",
          "type": "address"
        }
      ],
      "name": "balanceOf",
      "outputs": [
        {
          "name": "",
          "type": "uint256"
        }
      ],
      "payable": false,
      "type": "function"
    },
    {
      "constant": false,
      "inputs": [
        {
          "name": "_blgHub",
          "type": "address"
        }
      ],
      "name": "setBLGHub",
      "outputs": [
        {
          "name": "",
          "type": "bool"
        }
      ],
      "payable": false,
      "type": "function"
    },
    {
      "constant": true,
      "inputs": [],
      "name": "NAME",
      "outputs": [
        {
          "name": "",
          "type": "string"
        }
      ],
      "payable": false,
      "type": "function"
    },
    {
      "constant": false,
      "inputs": [
        {
          "name": "_to",
          "type": "address"
        },
        {
          "name": "_value",
          "type": "uint256"
        }
      ],
      "name": "transfer",
      "outputs": [
        {
          "name": "",
          "type": "bool"
        }
      ],
      "payable": false,
      "type": "function"
    },
    {
      "constant": true,
      "inputs": [
        {
          "name": "_owner",
          "type": "address"
        },
        {
          "name": "_spender",
          "type": "address"
        }
      ],
      "name": "allowance",
      "outputs": [
        {
          "name": "remaining",
          "type": "uint256"
        }
      ],
      "payable": false,
      "type": "function"
    },
    {
      "constant": true,
      "inputs": [],
      "name": "blgHub_",
      "outputs": [
        {
          "name": "",
          "type": "address"
        }
      ],
      "payable": false,
      "type": "function"
    },
    {
      "constant": true,
      "inputs": [],
      "name": "blg_",
      "outputs": [
        {
          "name": "",
          "type": "address"
        }
      ],
      "payable": false,
      "type": "function"
    },
    {
      "inputs": [],
      "payable": false,
      "type": "constructor"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "name": "_from",
          "type": "address"
        },
        {
          "indexed": true,
          "name": "_to",
          "type": "address"
        },
        {
          "indexed": false,
          "name": "_value",
          "type": "uint256"
        }
      ],
      "name": "Transfer",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "name": "_to",
          "type": "address"
        },
        {
          "indexed": false,
          "name": "to",
          "type": "address"
        },
        {
          "indexed": false,
          "name": "value",
          "type": "uint256"
        },
        {
          "indexed": false,
          "name": "totalSupply",
          "type": "uint256"
        }
      ],
      "name": "LogTokensMinted",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": false,
          "name": "active",
          "type": "bool"
        }
      ],
      "name": "LogActivated",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": false,
          "name": "errorString",
          "type": "string"
        }
      ],
      "name": "LogErrorString",
      "type": "event"
    }
  ],
  "unlinked_binary": "0x6060604052341561000c57fe5b5b60028054600160a060020a03191633600160a060020a03161790556003805460a060020a60ff02191690555b5b610a3d806100496000396000f300606060405236156100bf5763ffffffff60e060020a600035041663095ea7b381146100c157806318160ddd146100f457806323b872dd146101165780632e0f26251461014f578063324536eb1461017157806340c10f19146101935780634d7c09dd146101c65780636ca34ea2146101ea57806370a082311461021857806395e087fe14610246578063a3f4df7e14610276578063a9059cbb14610306578063dd62ed3e14610339578063f06d87be1461036d578063fc31723014610399575bfe5b34156100c957fe5b6100e0600160a060020a03600435166024356103c5565b604080519115158252519081900360200190f35b34156100fc57fe5b6101046103ce565b60408051918252519081900360200190f35b341561011e57fe5b6100e0600160a060020a03600435811690602435166044356103d5565b604080519115158252519081900360200190f35b341561015757fe5b6101046103df565b60408051918252519081900360200190f35b341561017957fe5b6101046103e4565b60408051918252519081900360200190f35b341561019b57fe5b6100e0600160a060020a03600435166024356103ea565b604080519115158252519081900360200190f35b34156101ce57fe5b6100e0610625565b604080519115158252519081900360200190f35b34156101f257fe5b610104600160a060020a0360043516610635565b60408051918252519081900360200190f35b341561022057fe5b610104600160a060020a0360043516610647565b60408051918252519081900360200190f35b341561024e57fe5b6100e0600160a060020a0360043516610666565b604080519115158252519081900360200190f35b341561027e57fe5b6102866107ba565b6040805160208082528351818301528351919283929083019185019080838382156102cc575b8051825260208311156102cc57601f1990920191602091820191016102ac565b505050905090810190601f1680156102f85780820380516001836020036101000a031916815260200191505b509250505060405180910390f35b341561030e57fe5b6100e0600160a060020a03600435166024356107da565b604080519115158252519081900360200190f35b341561034157fe5b610104600160a060020a03600435811690602435166103c5565b60408051918252519081900360200190f35b341561037557fe5b61037d610911565b60408051600160a060020a039092168252519081900360200190f35b34156103a157fe5b61037d610920565b60408051600160a060020a039092168252519081900360200190f35b60005b92915050565b6000545b90565b60005b9392505050565b601281565b60005481565b60035460009060a060020a900460ff1615156104535761044c606060405190810160405280602181526020017f424c47206973206e6f7420796574206163746976652c20424c472e6d696e7428815260200160f860020a60290281525061092f565b90506103c8565b60035433600160a060020a039081169116146104af5761044c604060405190810160405280602081526020017f6d73672e73656e64657220213d20626c674875622c20424c472e6d696e74282981525061092f565b90506103c8565b600082116105105761044c606060405190810160405280602781526020017f43616e6e6f74206d696e7420612076616c7565206f66203c3d20302c20424c47815260200160c860020a662e6d696e7428290281525061092f565b90506103c8565b600160a060020a038316151561057e5761044c606060405190810160405280602c81526020017f43616e6e6f74206d696e7420746f6b656e7320746f2061646472657373283029815260200160a060020a6b2c20424c472e6d696e7428290281525061092f565b90506103c8565b600054610591908363ffffffff6109e016565b6000908155600160a060020a0384168152600160205260409020546105bc908363ffffffff6109e016565b600160a060020a0384166000818152600160209081526040808320949094559054835183815291820186905281840152915190917f6d69c71ef35e507286bcb03186fe9ebdbf14f6e096ce22d6564de19afd7922b7919081900360600190a25060015b92915050565b60035460a060020a900460ff1681565b60016020526000908152604090205481565b600160a060020a0381166000908152600160205260409020545b919050565b60025460009033600160a060020a039081169116146106d3576106cc606060405190810160405280602281526020017f6d73672e73656e64657220213d20626c672c20424c472e736574424c47487562815260200160f060020a6128290281525061092f565b9050610661565b600160a060020a038216151561074f576106cc606060405190810160405280603a81526020017f496e76616c69642068756220616464726573732c20626c67487562203d3d206181526020017f6464726573732830292c20424c472e736574424c47487562282900000000000081525061092f565b9050610661565b6003805460a060020a600160a060020a0319909116600160a060020a0385161760a060020a60ff021916179055604080516001815290517fe7261bb649db1e4cfb17b615c73a61fbfc88370a43040abb09b08ca8bd6817dd916020908290030190a15060015b919050565b604080518082019091526003815260e860020a62424c4702602082015281565b60035460009060a060020a900460ff1615156108485761044c606060405190810160405280602681526020017f424c47206973206e6f7420796574206163746976652c20424c472e736574424c815260200160d060020a654748756228290281525061092f565b90506103c8565b600160a060020a033316600090815260016020526040902054610871908363ffffffff6109fa16565b600160a060020a0333811660009081526001602052604080822093909355908516815220546108a6908363ffffffff6109e016565b600160a060020a038085166000818152600160209081526040918290209490945580518681529051919333909316927fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef92918290030190a35060015b92915050565b60005b92915050565b600354600160a060020a031681565b600254600160a060020a031681565b60007f551303dd5f39cbfe6daba6b3e27754b8a7d72f519756a2cde2b92c2bbde159a782604051808060200182810382528381815181526020019150805190602001908083836000831461099e575b80518252602083111561099e57601f19909201916020918201910161097e565b505050905090810190601f1680156109ca5780820380516001836020036101000a031916815260200191505b509250505060405180910390a15060005b919050565b6000828201838110156109ef57fe5b8091505b5092915050565b600082821115610a0657fe5b508082035b929150505600a165627a7a723058206ed3db58c215c9e8c3aa4b0013944bc190d28cc846f964608e8851c1d751b7a40029",
  "networks": {
    "1503605493729": {
      "links": {},
      "events": {
        "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef": {
          "anonymous": false,
          "inputs": [
            {
              "indexed": true,
              "name": "_from",
              "type": "address"
            },
            {
              "indexed": true,
              "name": "_to",
              "type": "address"
            },
            {
              "indexed": false,
              "name": "_value",
              "type": "uint256"
            }
          ],
          "name": "Transfer",
          "type": "event"
        },
        "0x6d69c71ef35e507286bcb03186fe9ebdbf14f6e096ce22d6564de19afd7922b7": {
          "anonymous": false,
          "inputs": [
            {
              "indexed": true,
              "name": "_to",
              "type": "address"
            },
            {
              "indexed": false,
              "name": "to",
              "type": "address"
            },
            {
              "indexed": false,
              "name": "value",
              "type": "uint256"
            },
            {
              "indexed": false,
              "name": "totalSupply",
              "type": "uint256"
            }
          ],
          "name": "LogTokensMinted",
          "type": "event"
        },
        "0xe7261bb649db1e4cfb17b615c73a61fbfc88370a43040abb09b08ca8bd6817dd": {
          "anonymous": false,
          "inputs": [
            {
              "indexed": false,
              "name": "active",
              "type": "bool"
            }
          ],
          "name": "LogActivated",
          "type": "event"
        },
        "0x551303dd5f39cbfe6daba6b3e27754b8a7d72f519756a2cde2b92c2bbde159a7": {
          "anonymous": false,
          "inputs": [
            {
              "indexed": false,
              "name": "errorString",
              "type": "string"
            }
          ],
          "name": "LogErrorString",
          "type": "event"
        }
      },
      "updated_at": 1503619442296
    },
    "1503663160069": {
      "links": {},
      "events": {
        "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef": {
          "anonymous": false,
          "inputs": [
            {
              "indexed": true,
              "name": "_from",
              "type": "address"
            },
            {
              "indexed": true,
              "name": "_to",
              "type": "address"
            },
            {
              "indexed": false,
              "name": "_value",
              "type": "uint256"
            }
          ],
          "name": "Transfer",
          "type": "event"
        },
        "0x6d69c71ef35e507286bcb03186fe9ebdbf14f6e096ce22d6564de19afd7922b7": {
          "anonymous": false,
          "inputs": [
            {
              "indexed": true,
              "name": "_to",
              "type": "address"
            },
            {
              "indexed": false,
              "name": "to",
              "type": "address"
            },
            {
              "indexed": false,
              "name": "value",
              "type": "uint256"
            },
            {
              "indexed": false,
              "name": "totalSupply",
              "type": "uint256"
            }
          ],
          "name": "LogTokensMinted",
          "type": "event"
        },
        "0xe7261bb649db1e4cfb17b615c73a61fbfc88370a43040abb09b08ca8bd6817dd": {
          "anonymous": false,
          "inputs": [
            {
              "indexed": false,
              "name": "active",
              "type": "bool"
            }
          ],
          "name": "LogActivated",
          "type": "event"
        },
        "0x551303dd5f39cbfe6daba6b3e27754b8a7d72f519756a2cde2b92c2bbde159a7": {
          "anonymous": false,
          "inputs": [
            {
              "indexed": false,
              "name": "errorString",
              "type": "string"
            }
          ],
          "name": "LogErrorString",
          "type": "event"
        }
      },
      "updated_at": 1503663177313
    },
    "1503668134525": {
      "links": {},
      "events": {
        "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef": {
          "anonymous": false,
          "inputs": [
            {
              "indexed": true,
              "name": "_from",
              "type": "address"
            },
            {
              "indexed": true,
              "name": "_to",
              "type": "address"
            },
            {
              "indexed": false,
              "name": "_value",
              "type": "uint256"
            }
          ],
          "name": "Transfer",
          "type": "event"
        },
        "0x6d69c71ef35e507286bcb03186fe9ebdbf14f6e096ce22d6564de19afd7922b7": {
          "anonymous": false,
          "inputs": [
            {
              "indexed": true,
              "name": "_to",
              "type": "address"
            },
            {
              "indexed": false,
              "name": "to",
              "type": "address"
            },
            {
              "indexed": false,
              "name": "value",
              "type": "uint256"
            },
            {
              "indexed": false,
              "name": "totalSupply",
              "type": "uint256"
            }
          ],
          "name": "LogTokensMinted",
          "type": "event"
        },
        "0xe7261bb649db1e4cfb17b615c73a61fbfc88370a43040abb09b08ca8bd6817dd": {
          "anonymous": false,
          "inputs": [
            {
              "indexed": false,
              "name": "active",
              "type": "bool"
            }
          ],
          "name": "LogActivated",
          "type": "event"
        },
        "0x551303dd5f39cbfe6daba6b3e27754b8a7d72f519756a2cde2b92c2bbde159a7": {
          "anonymous": false,
          "inputs": [
            {
              "indexed": false,
              "name": "errorString",
              "type": "string"
            }
          ],
          "name": "LogErrorString",
          "type": "event"
        }
      },
      "updated_at": 1503682624711
    },
    "1503690755708": {
      "links": {},
      "events": {
        "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef": {
          "anonymous": false,
          "inputs": [
            {
              "indexed": true,
              "name": "_from",
              "type": "address"
            },
            {
              "indexed": true,
              "name": "_to",
              "type": "address"
            },
            {
              "indexed": false,
              "name": "_value",
              "type": "uint256"
            }
          ],
          "name": "Transfer",
          "type": "event"
        },
        "0x6d69c71ef35e507286bcb03186fe9ebdbf14f6e096ce22d6564de19afd7922b7": {
          "anonymous": false,
          "inputs": [
            {
              "indexed": true,
              "name": "_to",
              "type": "address"
            },
            {
              "indexed": false,
              "name": "to",
              "type": "address"
            },
            {
              "indexed": false,
              "name": "value",
              "type": "uint256"
            },
            {
              "indexed": false,
              "name": "totalSupply",
              "type": "uint256"
            }
          ],
          "name": "LogTokensMinted",
          "type": "event"
        },
        "0xe7261bb649db1e4cfb17b615c73a61fbfc88370a43040abb09b08ca8bd6817dd": {
          "anonymous": false,
          "inputs": [
            {
              "indexed": false,
              "name": "active",
              "type": "bool"
            }
          ],
          "name": "LogActivated",
          "type": "event"
        },
        "0x551303dd5f39cbfe6daba6b3e27754b8a7d72f519756a2cde2b92c2bbde159a7": {
          "anonymous": false,
          "inputs": [
            {
              "indexed": false,
              "name": "errorString",
              "type": "string"
            }
          ],
          "name": "LogErrorString",
          "type": "event"
        }
      },
      "updated_at": 1503698395665
    },
    "1503769219669": {
      "links": {},
      "events": {
        "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef": {
          "anonymous": false,
          "inputs": [
            {
              "indexed": true,
              "name": "_from",
              "type": "address"
            },
            {
              "indexed": true,
              "name": "_to",
              "type": "address"
            },
            {
              "indexed": false,
              "name": "_value",
              "type": "uint256"
            }
          ],
          "name": "Transfer",
          "type": "event"
        },
        "0x6d69c71ef35e507286bcb03186fe9ebdbf14f6e096ce22d6564de19afd7922b7": {
          "anonymous": false,
          "inputs": [
            {
              "indexed": true,
              "name": "_to",
              "type": "address"
            },
            {
              "indexed": false,
              "name": "to",
              "type": "address"
            },
            {
              "indexed": false,
              "name": "value",
              "type": "uint256"
            },
            {
              "indexed": false,
              "name": "totalSupply",
              "type": "uint256"
            }
          ],
          "name": "LogTokensMinted",
          "type": "event"
        },
        "0xe7261bb649db1e4cfb17b615c73a61fbfc88370a43040abb09b08ca8bd6817dd": {
          "anonymous": false,
          "inputs": [
            {
              "indexed": false,
              "name": "active",
              "type": "bool"
            }
          ],
          "name": "LogActivated",
          "type": "event"
        },
        "0x551303dd5f39cbfe6daba6b3e27754b8a7d72f519756a2cde2b92c2bbde159a7": {
          "anonymous": false,
          "inputs": [
            {
              "indexed": false,
              "name": "errorString",
              "type": "string"
            }
          ],
          "name": "LogErrorString",
          "type": "event"
        }
      },
      "updated_at": 1503769599564
    }
  },
  "schema_version": "0.0.5",
  "updated_at": 1503769599564
}
const blgTokenAddress = '0xe39cf27516a1c4bddec850d9624e73ff8625a14e'

initializeApp()

/**
 * Initialize the app, loading data primarily.
 */
async function initializeApp () {
  await initEtherConnection()
  await initBLGAndHubContracts()
  loadAllUsers()
  loadAllResources()
  createContractListeners(hub)
  createContractListeners(blgToken)
  loadNewsFeed()
}

/**
 * Append the resource html to the table.
 * @param  {String} url  Resource URL.
 * @param  {Address} user  User's EOA address.
 * @param  {Number} timestamp The time this resource was added at.
 */
function appendNewResource (url, user, reputation, blockNumber) {
  $('#topResources').append(
    '<div class="card mb-3"><div class="card-body">'
    + '<h6 class="card-title mb-1"><a href="'+ url +'">'
    + url + '</a></h6><p class="card-text small">' + user
    + '</p></div><hr class="my-0"><div class="card-body py-2 small">'
    +'<a class="mr-3 d-inline-block" href="#"><strong>'+ reputation +' </strong>'
    +'<i class="fa fa-fw fa-thumbs-up">'
    +'</i>Like</a><a class="mr-3 d-inline-block" href="#"></div>'
    +'<div class="card-footer small text-muted">Added at block number: '+ blockNumber +'</div></div>'
  )
}

function appendNewUser(userData) {
  $('#participantsTable').append(
    '<tr><td>'
    + userData[0] + '</td><td>'
    + userData[1] + '</td><td>'
    + userData[2] + '</td><td>'
    + userData[3]
    + ' BLG </td><</tr>'
  )
}

/**
 * Create listeners for all events of a given contract.
 */
async function createContractListeners (contract) {
  contract.allEvents({ fromBlock: 'latest', toBlock: 'latest' }).watch((err, res) => {
    if (err) {
      console.log(err)

    } else if (res['event']) {
      _event = res['event']
      // Update newsfeed with all events then event specific callback
      updateNewsFeed(res)
      listenerEventCallbacks[_event](res)
    }
  })
}

/*
 Event Callbacks
 */
function blgTokenActivatedCb (res) {
   console.log('blgTokenActivatedCb')
   console.log(res)
 }

function errorStringCb (res) {
   console.log('errorStringCb')
   console.log(res)
 }

async function tokensMintedCb (res) {
  console.log('tokensMintedCb')
  console.log(res)
  // Update balance of user in table
  const userData = await hub.getUserData.call(res.args.to)
  // TODO update cell in table for user that received the tokens
}

/**
 * Callback when resource added event is emitted by hub. Append the resource the
 * the resource table
 * @param  {Object} res The event log object.
 */
async function resourceAddedCb (res) {
  // Get the real user name not the address
  const userData = await hub.getUserData.call(res.args.user)
  appendNewResource(res.args.resourceUrl, userData[0], 0, res.args.blockNumber)
}

async function userAddedCb (res) {
  console.log('userAddedCb')
  console.log(res)
  const userData = await hub.getUserData.call(res.args.user)
  userData[3] = 0 // default to 0 blg tokens
  appendNewUser(userData)
}

/**
 * [initBLGAndHubContracts description]
 */
async function initBLGAndHubContracts () {
  hub = await web3.eth.contract(staticHub.abi).at(staticHubAddress)
  blgToken = await web3.eth.contract(blg.abi).at(blgTokenAddress)
}

/**
 * Initialize the connection to an ether client.
 */
async function initEtherConnection () {
  // Local Dev client connection
  web3 = new Web3(
    new Web3.providers.HttpProvider('http://localhost:8545')
  );

  // Deploy on Kovan testnet via infura
  // const web3 = new Web3(
  //   new Web3.providers.HttpProvider('https://kovan.infura.io/thMAdMI5QeIf8dirn63U')
  // );

  // console.log('wbe3 Connected? ' + web3.isConnected());
}

/**
 * Get all users within the hub and load into table.
 * TODO: look to get just active users?
 */
async function loadAllUsers () {
  // TODO define this url in a nice format
  const url = 'http://localhost:8081/loadUsers'

  $.ajax({
     url: url,
     data: {
        format: 'json'
     },
     error: err => {
       console.log('error: ' + error)
     },
     success: users => {
       users.sort(sortUsersByReputation);

       for (let i = 0; i < users.length; i++) {
         appendNewUser(users[i])
       }
     },
     type: 'GET'
  });
}

/**
 * Get all resources within the hub and load into table.
 */
async function loadAllResources () {
  // TODO define this url in a nice format
  const url = 'http://localhost:8081/loadResources'

  $.ajax({
     url: url,
     data: {
        format: 'json'
     },
     error: err => {
       console.log('error: ' + error)
     },
     success: resources => {
       // Sort by highest reputation
       resources.sort(sortResourcesByReputation);

       for (let i = 0; i < resources.length; i++) {
        appendNewResource(
          resources[i][0], // url
          resources[i][1], // user name
          resources[i][2], // reputation
          resources[i][3] // block number
        )
       }
     },
     type: 'GET'
  });
}

/**
 * Load newsfeed with 10 latest events.
 */
function loadNewsFeed() {
  const url = 'http://localhost:8081/loadEvents'

  $.ajax({
     url: url,
     data: {
        format: 'json'
     },
     error: err => {
       console.log('error: ' + err)
     },
     success: events => {
       for (let i = 0; i < events.length; i++) {
         updateNewsFeed(events[i])
       }
     },
     type: 'GET'
  });
}

/**
 * Sort the 2D array by the reputation column.
 * @param  {[type]} a [description]
 * @param  {[type]} b [description]
 * @return {[type]}   [description]
 */
function sortResourcesByReputation (a, b) {
  if (a[2] === b[2]) {
    return 0;
  } else {
    return (a[2] > b[2]) ? -1 : 1;
  }
}

/**
 * Sort the 2D array by the reputation column.
 * @param  {[type]} a [description]
 * @param  {[type]} b [description]
 * @return {[type]}   [description]
 */
function sortUsersByReputation (a, b) {
  if (a[3] === b[3]) {
    return 0;
  } else {
    return (a[3] > b[3]) ? -1 : 1;
  }
}

/**
 * Prepend a new item to the newsfeed table
 * @param  {[type]} data [description]
 * @return {[type]}      [description]
 */
async function updateNewsFeed(data) {
  let _event = data['event'].replace('Log', '')
  let img
  let args

  let userData
  if (_event === 'UserAdded') {
    img = '<img class="d-flex mr-3 rounded-circle" src="img/userAdded.png" height="55" width="55">'
    userData = await hub.getUserData.call(data.args.user)
    args = 'Name: ' + userData[0] + '</br>Position: ' + userData[1] + '</br>Location: ' + userData[2]

  } else if (_event === 'ResourceAdded') {
    img = '<img class="d-flex mr-3 rounded-circle" src="img/resourceAdded.png" height="55" width="55">'
    userData = await hub.getUserData.call(data.args.user)
    args = data.args.resourceUrl + '</br> Added by: ' + userData[0]

  } else if (_event === 'TokensMinted') {
    img = '<img class="d-flex mr-3 rounded-circle" src="img/tokensMinted.png" height="55" width="55">'
    userData = await hub.getUserData.call(data.args.to)
    args = '1 BLG token minted!' + '</br> To: ' + userData[0]

  } else if (_event === 'ErrorString') {
    _event = _event.replace('String', '')
    img = '<img class="d-flex mr-3 rounded-circle" src="img/error.png" height="55" width="55">'
    args = '' + data.args.errorString

  } else {
    console.log('Uknown Event caught!: ' + _event)
    return
  }

  $('#newsFeed').prepend(
    '<a href="#" class="list-group-item list-group-item-action">'
      +'<div class="media">'
        + img
        +'<div class="media-body">'
          +'<strong>'+ data['event'].replace('Log', '') +'</strong></br>'
          + args
          +'<div class="text-muted smaller">Transaction: '+ data['transactionHash'].slice(0, 20) +'...</div>'
          +'<div class="text-muted smaller">Mined at block: '+ data['blockNumber'] +'</div>'
        +'</div>'
      +'</div>'
    +'</a>'
  )
}
