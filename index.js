const fs = require('fs')
const path = require('path')
const express = require('express')
const WebSocket = require('ws')
const Gpio = require('onoff').Gpio

const wss = new WebSocket.Server({ port: 3001 })
const app = express()

app.use('/', express.static(path.join(__dirname, 'captcha')))
app.use('/qr', express.static(path.join(__dirname, 'qr')))
app.listen(3000)

const sensor = new Gpio(14, 'in', 'rising', { debounceTimeout: 100 })
const motor = new Gpio(15, 'out')

const db = {
  file: 'db.json',
  store: []
}

let state = 'closed'
let socket

sensor.watch((err, value) => {
  console.log(value)
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

      setTimeout(() => {
        hold()
      }, 1000 * 5)
    }
  })
})

function load () {
  fs.readFile(path.join(__dirname, db.file), 'utf8', (err, data) => {
    if (err) {
      fs.writeFile(path.join(__dirname, db.file), '[]', (err) => {
        if (err) return
      })
    }

    if (data) {
      db.store = JSON.parse(data)
    }
  })
}

function store (token) {
  const entry = {
    timestamp: Date.now(),
    token: token
  }

  db.store.push(entry)

  fs.writeFile(path.join(__dirname, db.file), JSON.stringify(db.store, null, 2), 'utf8', (err, data) => {
    if (err) console.log(err)
  })
}

function release () {
  motor.writeSync(0)
  console.log('open')

  setTimeout(() => {
    state = 'open'
  }, 500)
}

function hold () {
  motor.writeSync(1)
  state = 'closed'
  console.log('closed')

  const msg = {
    do: 'reload'
  }

  if (socket) {
    socket.send(JSON.stringify(msg))
  }
}

motor.writeSync(1)
load()
