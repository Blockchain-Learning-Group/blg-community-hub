const express = require('express')
const app = express()
const etherUtils = require('./server/ether')

app.use(express.static('client'))

// Default Home route
app.get('/', (req, res) => {
   res.sendFile( __dirname + "/client/" + "home.html" )
})

/**
* Load all users saved in hub storage.
 */
app.get('/loadUsers', async (req, res) => {
  res.send(await etherUtils.getAllUserDataAndBLGBalances())
})

/**
 * Load all resources saved in hub storage.
 */
app.get('/loadResources', async (req, res) => {
  res.send(await etherUtils.getAllResources())
})

/**
 * Load 10 latest events.
 */
app.get('/loadEvents', async (req, res) => {
  res.send(await etherUtils.getLatestEvents())
})

/**
 * Load 10 latest events.
 */
app.post('/resourceLiked/:resource/:userIp', async (req, res) => {
  const response = await etherUtils.likeResource(req.params.resource, req.params.userIp)
  res.send(response)
})

const server = app.listen(8081, () => {
   const host = server.address().address
   const port = server.address().port

   console.log('Server listening on port: ' + port)
})
