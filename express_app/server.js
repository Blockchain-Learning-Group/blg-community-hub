const express = require('express')
const app = express()
const etherUtils = require('./etherUtils')

app.use(express.static('public'))

// Default Home route
app.get('/', (req, res) => {
   res.sendFile( __dirname + "/" + "home.html" )
})

const server = app.listen(8081, () => {
   const host = server.address().address
   const port = server.address().port
})
