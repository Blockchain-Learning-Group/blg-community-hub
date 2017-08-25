const express = require('express')
const app = express()
const etherUtils = require('./server/ether')

app.use(express.static('client'))

// Default Home route
app.get('/', (req, res) => {
   res.sendFile( __dirname + "/client/" + "home.html" )
})

// Hit the hub to get users
app.get('/getUsers', async (req, res) => {
  res.send(await etherUtils.getUsers())
})

const server = app.listen(8081, () => {
   const host = server.address().address
   const port = server.address().port
})
