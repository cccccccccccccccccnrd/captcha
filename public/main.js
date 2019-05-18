const WS_URL = window.location.hostname === 'localhost' ? 'ws://localhost:3001' : 'ws://192.168.178.81:3001'
const socket = new WebSocket(WS_URL)

function passed (token) {
  const msg = {
    do: 'release',
    token: token
  }

  socket.send(JSON.stringify(msg))
  console.log('send', token)

  setTimeout(() => {
    location.reload()
  }, duration)
}

socket.addEventListener('message', (message) => {
  const msg = JSON.parse(message.data)

  if (msg.do === 'reload') {
    location.reload()
  }
})