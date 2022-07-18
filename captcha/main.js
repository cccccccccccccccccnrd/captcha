const WS_URL = window.location.hostname === 'localhost' ? 'ws://localhost:3001' : 'ws://10.10.10.100:3001'
const socket = new WebSocket(WS_URL)

function passed (token) {
  const msg = {
    do: 'release',
    token: token
  }

  socket.send(JSON.stringify(msg))
}

socket.addEventListener('message', (message) => {
  const msg = JSON.parse(message.data)

  if (msg.do === 'reload') {
    location.reload()
  }
})