const WS_URL = window.location.hostname === 'localhost' ? 'ws://localhost:3001' : 'wss://172.16.214.54:3001'
const socket = new WebSocket(WS_URL)

const video = document.createElement('video')
const canvasElement = document.querySelector('#canvas')
const canvas = canvasElement.getContext('2d')

const state = {
  codes: [],
  data: 'cool'
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

      if (code && code.data === state.data && state.codes.filter(Boolean).length === 1) {
        console.log('passed')
        /* passed(code.data) */
        graphic('success')
        const audio = new Audio('assets/success.mp3')
        audio.play()
      } else if (code && code.data !== state.data && state.codes.filter(Boolean).length === 1) {
        console.log('another')
        graphic('error')

        setTimeout(() => {
          graphic('welcome')
        }, 5000)
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

function graphic (term) {
  document.querySelector('#graphic').src = `assets/${term}.png`
}

socket.addEventListener('message', (message) => {
  const msg = JSON.parse(message.data)

  if (msg.do === 'reload') {
    console.log('reload')
    graphic('welcome')
  }
})
