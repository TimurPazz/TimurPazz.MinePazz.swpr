const sounds = {
    click: new Audio("assets/click.wav"),
    flag: new Audio("assets/flag.wav"),
    boom: new Audio("assets/boom.wav"),
    win: new Audio("assets/win.wav")
};

function play(sound) {
    if (!sounds[sound]) return;
    sounds[sound].currentTime = 0;
    sounds[sound].play();
}

/* ===== СЛОЖНОСТЬ ===== */
let WIDTH = 9;
let HEIGHT = 9;
let MINES_COUNT = 10;

/* ===== СОСТОЯНИЕ ===== */
let board = [];
let firstClick = true;
let gameOver = false;

let timer = 0;
let timerInterval = null;

/* ===== DOM ===== */
const boardEl = document.getElementById("board");
const faceButton = document.getElementById("faceButton");
const timerEl = document.getElementById("timer");
const mineCounterEl = document.getElementById("mineCounter");
const difficultyEl = document.getElementById("difficulty");
const themeButton = document.getElementById("themeButton");
/* ===== ТЕМЫ ===== */
let darkMode = false;
themeButton.addEventListener("click", () => {
    darkMode = !darkMode;
    document.body.classList.toggle("dark");
    themeButton.textContent = darkMode ? "light theme☀️" : "dark theme🌙";
});

/* ===== ЛИЦА ===== */
const faces = {
    normal: ": ]",
    press: ">_<",
    dead: "X_x",
    win: "B)",
    xd: "XD"
};

function setFace(f) {
    faceButton.textContent = faces[f];
}

/* ===== СЛОЖНОСТЬ ===== */
difficultyEl.addEventListener("change", () => {

    switch (difficultyEl.value) {

        case "easy":
            WIDTH = 9;
            HEIGHT = 9;
            MINES_COUNT = 10;
            break;

        case "medium":
            WIDTH = 12;
            HEIGHT = 12;
            MINES_COUNT = 20;
            break;

        case "hard":
            WIDTH = 16;
            HEIGHT = 16;
            MINES_COUNT = 40;
            break;
    }

    createBoard();
});

/* ===== ТАЙМЕР ===== */
function startTimer() {
    if (timerInterval) return;
    timerInterval = setInterval(() => {
        timer++;
        timerEl.textContent = "⏱️ " + String(timer).padStart(3, "0");
    }, 1000);
}

function stopTimer() {
    clearInterval(timerInterval);
    timerInterval = null;
}

/* ===== СОЗДАНИЕ ПОЛЯ ===== */
function createBoard() {

    board = [];
    boardEl.innerHTML = "";
    firstClick = true;
    gameOver = false;

    timer = 0;
    timerEl.textContent = "⏱️ 000";
    setFace("normal");
    stopTimer();

    mineCounterEl.textContent = "💣 " + String(MINES_COUNT).padStart(3, "0");

    boardEl.style.gridTemplateColumns = `repeat(${WIDTH}, 32px)`;
    boardEl.style.gridTemplateRows = `repeat(${HEIGHT}, 32px)`;

    for (let y = 0; y < HEIGHT; y++) {
        board[y] = [];

        for (let x = 0; x < WIDTH; x++) {

            const cell = {
                x,
                y,
                mine: false,
                open: false,
                flagged: false,
                count: 0,
                el: document.createElement("div")
            };

            cell.el.classList.add("cell");

            cell.el.addEventListener("mousedown", () => {
                if (gameOver) return;
                setFace("press");
            });

            cell.el.addEventListener("mouseup", () => {
                if (gameOver) return;
                setFace("normal");
            });

            cell.el.addEventListener("click", () => {
                if (gameOver) return;
                if (cell.flagged) return;

                play("click");
                setFace("press");

                if (firstClick) {
                    placeMines(x, y);
                    calculateNumbers();
                    startTimer();
                    firstClick = false;
                }

                openCell(x, y);

                if (gameOver) {
                    render();
                    return;
                }

                checkWin();
                render();
            });

            cell.el.addEventListener("contextmenu", (e) => {
                e.preventDefault();
                if (gameOver || cell.open) return;

                cell.flagged = !cell.flagged;
                play("flag");

                cell.el.classList.add("flag-pop");

                setTimeout(() => {
                    cell.el.classList.remove("flag-pop");
                }, 150);

                render();
            });
board[y][x] = cell;
            boardEl.appendChild(cell.el);
        }
    }

    render();
}

/* ===== МИНЫ ===== */
function placeMines(safeX, safeY) {

    let placed = 0;

    while (placed < MINES_COUNT) {

        let x = Math.floor(Math.random() * WIDTH);
        let y = Math.floor(Math.random() * HEIGHT);

        let isSafe =
            Math.abs(x - safeX) <= 1 &&
            Math.abs(y - safeY) <= 1;

        if (!board[y][x].mine && !isSafe) {
            board[y][x].mine = true;
            placed++;
        }
    }
}

/* ===== ЧИСЛА ===== */
function calculateNumbers() {

    for (let y = 0; y < HEIGHT; y++) {
        for (let x = 0; x < WIDTH; x++) {

            let c = 0;

            for (let dy = -1; dy <= 1; dy++) {
                for (let dx = -1; dx <= 1; dx++) {

                    let nx = x + dx;
                    let ny = y + dy;

                    if (
                        nx >= 0 && ny >= 0 &&
                        nx < WIDTH && ny < HEIGHT &&
                        board[ny][nx].mine
                    ) {
                        c++;
                    }
                }
            }

            board[y][x].count = c;
        }
    }
}

/* ===== ОТКРЫТИЕ ===== */
function openCell(x, y) {

    const cell = board[y][x];

    if (cell.open || cell.flagged) return;

    cell.open = true;

    if (cell.mine) {
        gameOver = true;
        stopTimer();
        setFace("dead");
        play("boom");
        revealMines();
        return;
    }

    if (cell.count === 0) {

        for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {

                let nx = x + dx;
                let ny = y + dy;

                if (
                    nx >= 0 && ny >= 0 &&
                    nx < WIDTH && ny < HEIGHT
                ) {
                    openCell(nx, ny);
                }
            }
        }
    }
}

/* ===== ПОБЕДА ===== */
function checkWin() {

    let opened = 0;

    for (let y = 0; y < HEIGHT; y++) {
        for (let x = 0; x < WIDTH; x++) {

            if (board[y][x].open) opened++;
        }
    }

    if (opened === WIDTH * HEIGHT - MINES_COUNT) {
        gameOver = true;
        stopTimer();
        setFace("win");
        play("win");
    }
}

/* ===== МИНЫ ПОКАЗ ===== */
function revealMines() {

    let delay = 0;

    for (let y = 0; y < HEIGHT; y++) {

        for (let x = 0; x < WIDTH; x++) {

            const cell = board[y][x];

            if (cell.mine) {

                setTimeout(() => {

                    cell.el.textContent = "💣";
                    cell.el.classList.add("mine");

                }, delay);

                delay += 35;
            }
        }
    }
}

/* ===== РЕНДЕР ===== */
function render() {

    for (let y = 0; y < HEIGHT; y++) {
        for (let x = 0; x < WIDTH; x++) {

            const c = board[y][x];
            const el = c.el;

            el.className = "cell";
            el.textContent = "";

            if (c.open) {

                el.classList.add("open");

                if (c.mine) {
                    el.textContent = "💣";
                    el.classList.add("mine");
                } else if (c.count > 0) {
                    el.textContent = c.count;
                }
            }

            if (c.flagged && !c.open) {
                el.textContent = "🚩";
            }
        }
    }
}

/* ===== РЕСТАРТ ===== */
faceButton.addEventListener("click", () => {
    createBoard();
});

/* ===== СТАРТ ===== */
createBoard();