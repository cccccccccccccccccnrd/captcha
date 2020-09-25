const WS_URL = window.location.hostname === 'localhost' ? 'ws://localhost:3001' : 'ws://192.168.43.107:3001'
const socket = new WebSocket(WS_URL)

const video = document.createElement('video')
const canvasElement = document.querySelector('#canvas')
const canvas = canvasElement.getContext('2d')

const state = {
  codes: []
}

navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
  .then((stream) => {
    video.srcObject = stream
    video.setAttribute('playsinline', true)
    video.play()
    tick()
  })

  function tick() {
    if (video.readyState === video.HAVE_ENOUGH_DATA) {
      canvasElement.hidden = false
      canvasElement.height = video.videoHeight
      canvasElement.width = video.videoWidth

      canvas.drawImage(video, 0, 0, canvasElement.width, canvasElement.height)
      const imageData = canvas.getImageData(0, 0, canvasElement.width, canvasElement.height)
      const code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: 'dontInvert'
      })

      state.codes = [code, ...state.codes].slice(0, 3)
      console.log(state.codes.filter(Boolean).length)

      if (code && code.data === 'cool' && state.codes.filter(Boolean).length === 1) {
        passed(code.data)
        console.log('passed')
      }
    }

    setTimeout(() => {
      tick()
    }, 500)
  }

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
    console.log('reload')
  }
})
