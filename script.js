const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const missingLetterContainer = document.getElementById("missingLetters");
const backdrop = document.getElementById("backdrop");
const settingsPage = document.getElementById("settings");
const maxScoreInput = document.getElementById("maxScore");
const saveButton = document.getElementById("saveGame");
const settingsButton = document.getElementById("settingsButton");
const start = document.getElementById("start");
const cancelButton = document.getElementById("cancel");
const resetButton = document.getElementById("reset");
const letterGameType = document.getElementById("letters");
const numberGameType = document.getElementById("numbers");
const sound = document.getElementById("sound");
const homePanel = document.getElementById("home");

let requestID = null;
let isGameRunning = false;
let score = 0;
let elements = [];

maxScoreInput.value = localStorage.getItem("maxScore") || 10;
let maxScore = parseInt(maxScoreInput.value);

let gameType = localStorage.getItem("gameType") || (letterGameType.checked ? "letters" : "numbers");
letterGameType.checked = gameType === "letters";
numberGameType.checked = gameType === "numbers";

let hearSound = localStorage.getItem("hearSound") === "true" || false;
sound.checked = hearSound;

const laughSound = new Audio("sounds/rire.mp3");

saveButton.addEventListener("click", () => {
    maxScore = parseInt(maxScoreInput.value);
    gameType = letterGameType.checked ? "letters" : "numbers";
    hearSound = sound.checked;
    settingsPage.style.display = "none";
    // save those settings in local storage
    localStorage.setItem("maxScore", maxScore);
    localStorage.setItem("gameType", gameType);
    localStorage.setItem("hearSound", hearSound);
    resetGame();
    // stop the sound
    laughSound.pause();
    laughSound.currentTime = 0;
    isGameRunning = true;
    requestID && cancelAnimationFrame(requestID);
    gameLoop();
});

cancelButton.addEventListener("click", () => {
    maxScoreInput.value = maxScore;
    letterGameType.checked = gameType === "letters";
    numberGameType.checked = gameType === "numbers";
    sound.checked = hearSound;
    isGameRunning = true;
    settingsPage.style.display = "none";
    gameLoop();
});

resetButton.addEventListener("click", () => {
    maxScoreInput.value = 10;
    letterGameType.checked = true;
    numberGameType.checked = false;
    sound.checked = true;
    settingsPage.style.display = "none";

    localStorage.setItem("maxScore", 10);
    localStorage.setItem("gameType", "letters");
    localStorage.setItem("hearSound", true);

    maxScore = 10;
    gameType = "letters";
    hearSound = true;
    isGameRunning = true;
    requestID && cancelAnimationFrame(requestID);
    resetGame();
    gameLoop();
});

settingsButton.addEventListener("click", () => {
    isGameRunning = false;
    settingsPage.style.display = "flex";
    backdrop.style.display = "block";
    homePanel.style.display = "none";
    requestID && cancelAnimationFrame(requestID);
});

start.addEventListener("click", () => {
    isGameRunning = true;
    settingsPage.style.display = "none";
    homePanel.style.display = "none";
    requestID && cancelAnimationFrame(requestID);
    gameLoop();
});

settingsPage.style.display = "none";


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

            if (gameType === "letters" && /[A-Z]/.test(this.span.innerText)
                || gameType === "numbers" && /[0-9]/.test(this.span.innerText)
            ) {
                if (hearSound) laughSound.play();
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
            if (gameType === "letters" && /[A-Z]/.test(this.span.innerText)
                || gameType === "numbers" && /[0-9]/.test(this.span.innerText)
            ) {
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
    const height = canvas.height - canvas.height * .1;
    ctx.fillStyle = "#DDD";
    ctx.fillRect(canvas.width - 40, 0, jaugeWidth, height);

    // draw the fill bar
    ctx.fillStyle = "#FF0000";
    ctx.fillRect(canvas.width - 40, height - (height * score / maxScore), jaugeWidth, height * score / maxScore);

    // draw the border
    ctx.strokeStyle = "#000";
    ctx.lineWidth = 2;
    ctx.strokeRect(canvas.width - 40, 0, jaugeWidth, height);

    // draw the text on the left of the bar with a white background
    ctx.fillStyle = "#FFF";
    const scoreX = canvas.width - 40 - 100;
    ctx.fillRect(scoreX, 0, 150, 50);
    ctx.fillStyle = "#000";
    ctx.font = "30px Arial";
    ctx.fillText(score + "/" + maxScore, scoreX + 10, 35);
}

function gameLoop() {
    if (!isGameRunning) return;
    backdrop.style.display = "none";
    ctx.clearRect(0, 0, canvas.width, canvas.height);

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

    requestID = requestAnimationFrame(gameLoop);
}

function resetGame() {
    score = 0;
    elements.forEach(el => el.removeElement());
    elements = [];
    missingLetterContainer.innerHTML = "";
    document.querySelectorAll(".fallingElement").forEach(el => el.remove());
    document.querySelector("dotlottie-player")?.remove();
}

Promise.all(Object.values(images)).then(() => {
    gameLoop();
});

document.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
        isGameRunning = false;
        resetGame();
        isGameRunning = true;
        requestID && cancelAnimationFrame(requestID);
        gameLoop();
    }

    if (e.key === "Escape") {
        isGameRunning = !isGameRunning;
        settingsPage.style.display = isGameRunning ? "none" : "flex";
        backdrop.style.display = isGameRunning ? "none" : "block";
        gameLoop();
    }
});
