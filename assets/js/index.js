const cam = document.getElementById('cam')

const startVideo = () => {
  navigator.mediaDevices.enumerateDevices()
    .then(devices => {
      if (Array.isArray(devices)) {
        devices.forEach(device => {
          if (device.kind === 'videoinput') {

            navigator.getUserMedia(
              {
                video: {
                  deviceId: device.deviceId
                }
              },
              stream => cam.srcObject = stream,
              error => console.error(error)
            )
          }
        })
      }
    })
}



Promise.all([
  faceapi.nets.tinyFaceDetector.loadFromUri('/assets/lib/face-api/models'),
  faceapi.nets.faceLandmark68Net.loadFromUri('/assets/lib/face-api/models'),
  faceapi.nets.faceRecognitionNet.loadFromUri('/assets/lib/face-api/models'),
  faceapi.nets.faceExpressionNet.loadFromUri('/assets/lib/face-api/models'),
  faceapi.nets.ageGenderNet.loadFromUri('/assets/lib/face-api/models'),
]).then(startVideo)

cam.addEventListener('play', async () => {
  const canvas = faceapi.createCanvasFromMedia(cam)
  const canvasSize = {
    width: cam.width,
    height: cam.height
  }
  faceapi.matchDimensions(canvas, canvasSize)
  document.body.appendChild(canvas)
  setInterval(async () => {
    const detections = await faceapi
      .detectAllFaces(
        cam,
        new faceapi.TinyFaceDetectorOptions()
      )
      .withFaceLandmarks()
      .withFaceExpressions()
      .withAgeAndGender()
    const resizedDetections = faceapi.resizeResults(detections, canvasSize)

    canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height)
    faceapi.draw.drawDetections(canvas, resizedDetections)
    faceapi.draw.drawFaceLandmarks(canvas, resizedDetections)
    faceapi.draw.drawFaceExpressions(canvas, resizedDetections)
    resizedDetections.forEach(detection => {
      const { age, gender, genderProbability } = detection
      new faceapi.draw.DrawTextField([
        `${parseInt(age, 10)} years`,
        `${gender} (${parseInt(genderProbability * 100, 10)})`
      ], detection.detection.box.topRight).draw(canvas)
    })

  }, 100)
})
