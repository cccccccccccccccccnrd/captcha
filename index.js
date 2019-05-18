const path = require('path')
const express = require('express')
const WebSocket = require('ws')

const Gpio = require('onoff').Gpio
const sensor = new Gpio(14, 'in', 'rising', { debounceTimeout: 200 })
const relay = new Gpio(15, 'out')

relay.writeSync(0)
console.log(relay.readSync())

let socket
let state = 'closed'

sensor.watch((err, value) => {
  if (err) console.log(err)
  if (value && state === 'open') hold()
})

const app = express()

app.use(express.static(path.join(__dirname, 'public')))
app.listen(3000)

const wss = new WebSocket.Server({ port: 3001 })

wss.on('connection', (ws) => {
  socket = ws

  ws.on('message', (message) => {
    const msg = JSON.parse(message)

    if (msg.do === 'release') {
      console.log('release', msg.token)
      release()
    }
  })
})

function release () {
  relay.writeSync(0)
  state = 'open'
  console.log('open')
}

function hold () {
  relay.writeSync(1)
  state = 'closed'
  console.log('closed')

  const msg = {
    do: 'reload'
  }

  if (socket) socket.send(JSON.stringify(msg))
}

