const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const missingLetterContainer = document.getElementById("missingLetters");

let score = 0;
let isGameRunning = true;
let elements = [];

const maxScore = 5;
const images = {
    smiley: loadImage("images/smiley.gif"),
    lune: loadImage("images/lune.png"),
    fondCiel: loadImage("images/fond_ciel.png")
};

function loadImage(src) {
    const img = new Image();
    img.src = src;
    return img;
}
const rireSound = new Audio("sounds/rire.mp3");

function createLottieAnimation() {
    const lottie = document.createElement("dotlottie-player");
    lottie.setAttribute("src", "https://lottie.host/6c6200c9-d6e8-4817-8196-6ca8af222bfc/Js8Vok8v6f.json");
    lottie.setAttribute("background", "transparent");
    lottie.setAttribute("speed", "1");
    lottie.setAttribute("autoplay", "true");

    lottie.style.position = "absolute";
    lottie.style.left = "0";
    lottie.style.top = "0";
    lottie.style.width = "100%";
    lottie.style.height = "100%";
    lottie.style.zIndex = "1000";
    lottie.style.pointerEvents = "none";
    document.body.appendChild(lottie);
}

class FallingElement {
    constructor(value, x, y, speed) {
        this.value = value;
        this.x = x;
        this.y = y;
        this.speed = speed;
        this.toRemove = false;
        this.createSpan();
    }

    createSpan() {
        this.span = document.createElement("span");
        this.span.classList.add("fallingElement");
        this.span.innerText = this.value;
        this.span.style.left = this.x + "px";
        this.span.style.top = this.y + "px";
        document.body.appendChild(this.span);

        this.span.addEventListener("click", (e) => {
            if (!isGameRunning) return;

            if (/[A-Z]/.test(this.span.innerText)) {
                rireSound.play();
                score += 1;
                this.removeElement();
            } else {
                this.span.style.color = "#FF0000";
            }
        });
    }

    update() {
        this.y += this.speed;
        this.span.style.top = this.y + "px";
        if (this.y > canvas.height) {
            this.removeElement();
            if (/[A-Z]/.test(this.span.innerText)) {
                this.addMissingLetter();
            }
        }
        score = Math.max(score, 0);
    }

    removeElement() {
        this.toRemove = true;
        this.span.remove();
    }

    addMissingLetter() {
        const spans = Array.from(missingLetterContainer.querySelectorAll("span"));
        const isAlreadyThere = spans.some(span => span.innerText === this.value);
        if (!isAlreadyThere) {
            const span = document.createElement("span");
            span.innerText = this.value;
            missingLetterContainer.appendChild(span);
        }
    }
}

function generateRandomElement() {
    const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()";
    const randomChar = characters.charAt(Math.floor(Math.random() * characters.length));
    const randomX = Math.floor(Math.random() * canvas.width - 60);
    const randomSpeed = 1;
    const element = new FallingElement(randomChar, randomX, 0, randomSpeed);
    elements.push(element);
}

function drawJauge() {
    // redraw the fill bar each frame
    //width should be 4% of the canvas width
    const jaugeWidth = canvas.width * 0.04;
    ctx.fillStyle = "#DDD";
    ctx.fillRect(canvas.width - 40, 0, jaugeWidth, canvas.height);

    // draw the fill bar
    ctx.fillStyle = "#FF0000";
    ctx.fillRect(canvas.width - 40, canvas.height - (canvas.height * score / maxScore), jaugeWidth, canvas.height * score / maxScore);
}

function gameLoop() {
    if (!isGameRunning) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(images.fondCiel, 0, 0, canvas.width, canvas.height);
    ctx.drawImage(images.lune, 0, 0, 200, 200);

    if (score >= maxScore) {
        createLottieAnimation();
        elements = [];
        isGameRunning = false;
        return;
    }

    drawJauge();

    for (let el of elements) {
        el.update();
    }

    if (Math.random() < 0.02) {
        generateRandomElement();
    }

    // remove the elements marked for removal
    elements = elements.filter(el => !el.toRemove);

    requestAnimationFrame(gameLoop);
}

Promise.all(Object.values(images)).then(() => {
    generateRandomElement();
    gameLoop();
});

document.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
        isGameRunning = true;
        score = 0;
        Array.from(document.querySelectorAll(".fallingElement")).forEach(el => el.remove());
        elements = [];
        missingLetterContainer.innerHTML = "";
        document.querySelector("dotlottie-player")?.remove();
        gameLoop();
    }

    if (e.key === "Escape") {
        isGameRunning = !isGameRunning;
        gameLoop();
    }
});
