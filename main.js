const video = document.getElementById('video');
const message = document.getElementById('message');
const screenshotCanvas = document.getElementById('screenshot');
screenshotCanvas.crossOrigin = "Anonymous";
const screenshotContext = screenshotCanvas.getContext('2d');
const overlay = document.getElementById('overlay');
let countdown;
let stream;
// Smile detection variables
const MIN_CONSECUTIVE_FRAMES = 3;
let smileCounter1 = 0;
let smileCounter2 = 0;
let consecutiveSmiles1 = 0;
let consecutiveSmiles2 = 0;
let isSmiling1 = false;
let isSmiling2 = false;
let intervalStarted = false;
let gameOver = false;
let timeoutID;
let gameStarted = false;
let startCountdownFlag = false;

// Kamerayı başlat
function startCamera() {
    navigator.mediaDevices.getUserMedia({ video: { width: { ideal: 1080 }, height: { ideal: 1920 }, facingMode: 'user' } })
        .then(str => {
            stream = str;
            video.srcObject = stream;
            video.play().catch(err => {
                console.error("Error playing the video: " + err);
            });
        })
        .catch(err => {
            console.error("Error accessing the camera: " + err);
        });
}

// Video yüklendiğinde ve oynatılabilir hale geldiğinde smile detection başlat
video.addEventListener('loadedmetadata', () => {
    console.log("Video metadata loaded");
    video.play().catch(err => {
        console.error("Error playing the video: " + err);
    });
    video.addEventListener('canplay', () => {
        console.log("Video can play");
        detectSmile();
    });
});

// Gülümseme tespiti (placeholder)
function detectSmile() {
    console.log("Detecting smile");
    // Start the smile detection
    startSmileDetection();
  
}

// Geri sayımı başlat
function startCountdown() {
    console.log("Starting countdown");
    let timeLeft = 10;
    message.textContent = timeLeft;
    countdown = setInterval(() => {
        timeLeft--;
        message.textContent = timeLeft;
        if (timeLeft === 0) {
            clearInterval(countdown);
            captureFrame();
        }
    }, 1000);
}

// Screenshot al
function captureFrame() {

    console.log("Capturing frame");
    // Video elemanının hazır olduğundan emin ol
    if (video.readyState >= 2) {
        message.style.display = 'none';
        screenshotCanvas.width = video.videoWidth;
        screenshotCanvas.height = video.videoHeight;

        // video elementini canvas'a çiz
        screenshotContext.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);

        // overlay elementini canvas'a çiz (örneğin)
        let overlayImage = new Image();
        overlayImage.src = "overlay-modified.png";
        overlayImage.onload = function () {
            screenshotContext.drawImage(overlayImage, 0, 0, video.videoWidth, video.videoHeight);

            // Diğer işlemleri devam ettir
            showScreenshot();
        };
    } else {
        console.error("Video elementi hazır değil.");
    }
}

// Screenshot'ı göster
function showScreenshot() {
    console.log("Showing screenshot");
    screenshotCanvas.style.display = 'block';
    video.style.display = 'none';
    message.style.display = 'none';

    setTimeout(() => {
        printImage();
    }, 1000); // 1 saniye bekledikten sonra resmi yazdırıyoruz.
    setTimeout(() => {
        reset();
    }, 10000); // 10 saniye bekledikten sonra resetliyoruz.
}

// Resmi yazdır
function printImage() {
    console.log("Printing image");

    // Görüntüyü Base64 kodlamasıyla içe aktar
    html2canvas(document.body, {
        allowTaint: true,
        foreignObjectRendering: true,
    }).then((canvas => {
        // Canvas elementinden Base64 kodlanmış görüntüyü al
        let imageData = canvas.toDataURL('image/png');
        imageData.crossOrigin = 'anonymous';

        // Resmi yazdır (printJS ile)
        printJS({
            printable: imageData,
            base64: true,
            type: "image",
            style: "img { width: 540px; height: 960px; }"
        });
    }));
}
// Resetleme
function reset() {
    console.log("Resetting");
    screenshotCanvas.style.display = 'none';
    overlay.style.display = 'none';
    video.style.display = 'block';
    message.style.display = 'block';
    message.textContent = 'Poz Vermek İçin Gülümse';
    startCountdownFlag = false;
    startCamera();
}
// Function to initialize smile detection
// Function to initialize smile detection
async function startSmileDetection() {
    try {
        // Load the face-api models
        await faceapi.nets.ssdMobilenetv1.loadFromUri("./weights");
        await faceapi.nets.faceLandmark68Net.loadFromUri("./weights");
        await faceapi.nets.faceExpressionNet.loadFromUri("./weights");
        console.log("faceapi imported");
        // Video oynatıldığında detection işlemlerini sürekli olarak gerçekleştir
        

            // Sürekli olarak çalışacak döngü
            while (!startCountdownFlag) {
                const canvasFaceApi = faceapi.createCanvasFromMedia(video);
                const displaySize = { width: video.offsetWidth, height: video.offsetHeight };
                faceapi.matchDimensions(canvasFaceApi, displaySize);

                const detections = await faceapi
                    .detectAllFaces(video, new faceapi.SsdMobilenetv1Options())
                    .withFaceLandmarks()
                    .withFaceExpressions();
                const resizedDetections = faceapi.resizeResults(
                    detections,
                    displaySize
                );

                // Canvas temizleme işlemi
                canvasFaceApi.getContext("2d").clearRect(0, 0, canvasFaceApi.width, canvasFaceApi.height);

                // Tespitleri çizme işlemi
                faceapi.draw.drawDetections(canvasFaceApi, resizedDetections);
                faceapi.draw.drawFaceExpressions(canvasFaceApi, resizedDetections);

                // Gülümseme tespiti
                if (resizedDetections.length >= 1) {
                    if (resizedDetections[0].expressions.happy > 0.7) {
                        consecutiveSmiles1++;
                        if (
                            consecutiveSmiles1 >= MIN_CONSECUTIVE_FRAMES &&
                            !isSmiling1
                        ) {
                            smileCounter1++;
                            isSmiling1 = true;
                            consecutiveSmiles1 = 0;

                            // Gülümseme tespit edildiğinde başlatma işaretini ver
                            if (!startCountdownFlag) {
                                startCountdownFlag = true;
                                startCountdown();
                            }
                        }
                    } else {
                        isSmiling1 = false;
                        consecutiveSmiles1 = 0;
                    }
                }

                // Bir sonraki frame için bir süre bekleyin (örneğin 100ms)
                await new Promise(resolve => setTimeout(resolve, 100));
            }

    } catch (error) {
        console.error("An error occurred:", error);
    }
}



// Kamerayı başlat
startCamera();