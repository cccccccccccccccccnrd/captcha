const fs = require('fs')
const path = require('path')
const express = require('express')
const WebSocket = require('ws')
const Gpio = require('onoff').Gpio

const wss = new WebSocket.Server({ port: 3001 })
const app = express()

app.use(express.static(path.join(__dirname, 'public')))
app.listen(3000)

const sensor = new Gpio(14, 'in', 'rising', { debounceTimeout: 100 })
const relay = new Gpio(15, 'out')

let db = {
  file: 'db.json',
  store: []
}

let state = 'closed'
let socket

sensor.watch((err, value) => {
  if (err) console.log(err)
  if (value && state === 'open') hold()
})

wss.on('connection', (ws) => {
  socket = ws

  ws.on('message', (message) => {
    const msg = JSON.parse(message)

    if (msg.do === 'release') {
      store(msg.token)
      release()
    }
  })
})

function load () {
  fs.readFile(db.file, 'utf8', (err, data) => {
    if (err) return console.log(err)
    if (data) db.store = JSON.parse(data)
  })
}

function store (token) {
  const entry = {
    timestamp: Date.now(),
    token: token
  }

  db.store.push(entry)

  fs.writeFile(db.file, JSON.stringify(db.store, null, 2), 'utf8', (err, data) => {
    if (err) console.log(err)
  })
}

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

relay.writeSync(1)
load()
