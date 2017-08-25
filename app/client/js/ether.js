// Local Dev client connection
const web3 = new Web3(
  new Web3.providers.HttpProvider('http://localhost:8545')
);

// Deploy on Kovan testnet via infura
// const web3 = new Web3(
//   new Web3.providers.HttpProvider('https://kovan.infura.io/thMAdMI5QeIf8dirn63U')
// );

console.log('wbe3 Connected? ' + web3.isConnected());

getAllUsers()

/**
 * Get all users within the hub and load into table.
 * TODO: look to get just active users?
 */
function getAllUsers () {
  // TODO define this url in a nice format
  const url = 'http://localhost:8081/getUsers'

  $.ajax({
     url: url,
     data: {
        format: 'json'
     },
     error: err => {
       console.log('error: ' + error)
     },
     success: users => {
       let userAttrs

       $("#participantsTable").empty();

       for (let i = 0; i < users.length; i++) {
         userAttrs = users[i]
         $('#participantsTable').append(
           '<tr><td>' + userAttrs[0] + '</td><td>' + userAttrs[1] + '</td><td>' + userAttrs[2] + '</td><td> 100 BLG </td><</tr>'
         )
       }

      //  $('#participantsTable').bootstrapTable({
      //    data: {
      //      name: 'name',
      //      position: 'position',
      //    }
      //  });

     },
     type: 'GET'
  });
}
