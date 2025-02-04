const KEYS = {
	LEFT: 37,
	RIGHT: 39,
	SPACE: 32,
	KEY_A: 65,
	KEY_D: 68,
	KEY_W: 87,
	ENTER: 13,
};

// ------------------ Timer ------------------
const timeTag = document.querySelector('.game__timer > span');

let timeSetup = 0;
let time = timeSetup;

function initTimer() {
	time++;
	timeTag.innerText = time;
}
let timer;
let playerName;

//* =========== ARCANOID ======================================================
const canvas = document.getElementById('arcanoid');

let arcanoid = {
	ctx: null,
	isRun: true,
	ball: null,
	paddle: null,
	rectangles: [],
	widthGameSpace: 1024,
	heightGameSpace: 576,
	rowsRectangle: 5, //* число рядов
	colsRectangle: 14, //* число колонок
	countOfDestroyedRectgl: 0,
	sprites: {
		background: null,
		ball: null,
		paddle: null,
		rectangle: null,
	},
	sounds: {
		block: null,
		paddle: null,
		border: null,
		loss: null,
		win: null,
	},
	init() {
		this.ctx = canvas.getContext('2d');
		this.setFonsScore();
		this.setEventsKeys();
	},
	// ------------------ Controls ------------------
	setEventsKeys() {
		window.addEventListener("keydown", (e) => {
			if (e.keyCode === KEYS.SPACE || e.keyCode === KEYS.KEY_W) {
				this.paddle.startBallfromPaddle();
			} else if (e.keyCode === KEYS.LEFT || e.keyCode === KEYS.KEY_A || e.keyCode === KEYS.RIGHT || e.keyCode === KEYS.KEY_D) {
				this.paddle.startPaddle(e.keyCode);
			}
		});
		window.addEventListener("keyup", (e) => {
			this.paddle.stopPaddle();
		});
	},
	// ------------------ Assets ------------------
	preloadAssets(callback) {
		let loaded = 0;
		let required = Object.keys(this.sprites).length;
		required += Object.keys(this.sounds).length;

		let loadResource = () => {
			++loaded;
			if (loaded >= required) {
				callback();
			}
		};

		this.preloadSprites(loadResource);
		this.preloadSounds(loadResource);
	},
	preloadSprites(loadResource) {
		for (let key in this.sprites) {
			this.sprites[key] = new Image();
			this.sprites[key].src = `img/${key}.png`;
			this.sprites[key].addEventListener("load", loadResource);
		}
	},
	preloadSounds(loadResource) {
		for (let key in this.sounds) {
			this.sounds[key] = new Audio(`sounds/${key}.mp3`);
			this.sounds[key].addEventListener("canplaythrough", loadResource, { once: true });
		}
	},
	renderAssets() {
		this.ctx.clearRect(0, 0, this.widthGameSpace, this.heightGameSpace);
		this.ctx.drawImage(this.sprites.background, 0, 0);
		this.ctx.drawImage(this.sprites.ball, arcanoid.ball.x, arcanoid.ball.y);
		this.ctx.drawImage(this.sprites.paddle, this.paddle.x, this.paddle.y);
		this.renderRectangles();
		this.ctx.fillText(`Blocks: ${this.countOfDestroyedRectgl} / ${this.rectangles.length}`, 25, 567);
		if (!this.isRun) {
			if (this.countOfDestroyedRectgl == this.rectangles.length) {
				this.ctx.font = '45px PressStart2P';
				this.ctx.fillText('YOU WIN!', 340, 150);
				this.setFonsTime();
				this.setFonsPress();
			} else {
				this.ctx.font = '45px PressStart2P';
				this.ctx.fillText('GAME OVER', 310, 150);
				this.setFonsPress();
			}
		}
	},
	setFonsScore() {
		this.ctx.fillStyle = '#FFFFFF';
		this.ctx.font = '20px PressStart2P';
	},
	setFonsPress() {
		this.ctx.font = '20px PressStart2P';
		this.ctx.fillStyle = "#FF0000";
		this.ctx.fillText('press ENTER to restart', 294, 350);
	},
	setFonsTime() {
		this.ctx.font = '26px PressStart2P';
		this.ctx.fillStyle = '#FFA500';
		this.ctx.fillText(`Your time: ${time}`, 360, 210);
	},

	// ------------------ Rectangles ------------------
	renderRectangles() {
		for (let rectgl of this.rectangles) {
			if (rectgl.active) {
				this.ctx.drawImage(this.sprites.rectangle, rectgl.x, rectgl.y);
			}
		}
	},
	createRectangles() {
		for (let row = 0; row < this.rowsRectangle; row++) {
			for (let col = 0; col < this.colsRectangle; col++) {
				this.rectangles.push({
					x: 66 * col + 51,
					y: 34 * row + 5,
					width: 64,
					height: 32,
					active: true,
				});
			}
		}
	},
	// ------------------ update assets ------------------
	updateGameState() {
		this.ball.bounceGameBorder();
		this.paddle.bounceGameBorder();
		this.paddle.movePaddle();
		this.ball.moveBall();
		this.impactRectangle();
		this.impactPaddle();
	},
	addScore() {
		++this.countOfDestroyedRectgl;

		if (this.countOfDestroyedRectgl >= this.rectangles.length) {
			//! -------------------- !WIN! --------------------
			this.sounds.win.play();
			arcanoid.isRun = false;
			clearInterval(timer);
			player.classList.add('player-show');

		}
	},
	impactRectangle() {
		for (let rectgl of this.rectangles) {
			if (rectgl.active && this.ball.impact(rectgl)) {
				this.ball.bounceRectangle(rectgl);
				this.addScore();
				this.sounds.block.play();
			}
		}
	},
	impactPaddle() {
		if (this.ball.impact(this.paddle)) {
			this.ball.bouncePaddle(this.paddle);
			this.sounds.paddle.play();
		}

	},
	randomNum(min, max) {
		return Math.floor(Math.random() * (max - min + 1) + min);
	},

	// ------------------ Run and update ------------------
	runGame() {
		if (this.isRun) {
			window.requestAnimationFrame(() => {
				this.updateGameState();
				this.renderAssets();
				this.runGame();
			});
		}
	},
	start() {
		this.init();
		this.preloadAssets(() => {
			this.createRectangles();
			this.runGame();
		});
	},
};

arcanoid.ball = {
	x: 501,
	y: 478,
	width: 22,
	height: 22,
	dx: 0,
	dy: 0,
	velocity: 6,
	startBall() {
		this.dy = -this.velocity;
		this.dx = arcanoid.randomNum(-this.velocity, this.velocity);
	},
	moveBall() {
		if (this.dy) {
			this.y += this.dy;
		}
		if (this.dx) {
			this.x += this.dx;
		}
	},
	impact(elem) {
		let x = this.x + this.dx;
		let y = this.y + this.dy;

		if (x + this.width > elem.x &&
			x < elem.x + elem.width &&
			y + this.height > elem.y &&
			y < elem.y + elem.height) {
			return true;
		}
		return false;
	},
	bounceRectangle(rectgl) {
		this.dy *= -1;
		rectgl.active = false;

	},
	bouncePaddle(paddle) {
		if (paddle.dx) {
			this.x += paddle.dx;
		}

		if (this.dy > 0) {
			this.dy = -this.velocity;
			let touchX = this.x + this.width / 2;
			this.dx = this.velocity * paddle.getTouchOffset(touchX);
		}
	},
	bounceGameBorder() {
		let x = this.x + this.dx;
		let y = this.y + this.dy;

		let ballBorderLeft = x;
		let ballBorderRight = ballBorderLeft + this.width;
		let ballBorderTop = y;
		let ballBorderBottom = ballBorderTop + this.height;

		let gameBorderLeft = 0;
		let gameBorderRight = arcanoid.widthGameSpace;
		let gameBorderTop = 0;
		let gameBorderBottom = arcanoid.heightGameSpace;

		if (ballBorderLeft < gameBorderLeft) {
			this.x = 0;
			this.dx = this.velocity;
			arcanoid.sounds.border.play();
		} else if (ballBorderRight > gameBorderRight) {
			this.x = gameBorderRight - this.width;
			this.dx = -this.velocity;
			arcanoid.sounds.border.play();
		} else if (ballBorderTop < gameBorderTop) {
			this.y = 0;
			this.dy = this.velocity;
			arcanoid.sounds.border.play();
		} else if (ballBorderBottom > gameBorderBottom) {
			//! -------------------- !GAME OVER! --------------------
			arcanoid.sounds.loss.play();
			arcanoid.isRun = false;
			clearInterval(timer);
		}
	},
};

window.addEventListener("keydown", (e) => {
	if (!arcanoid.isRun && e.keyCode === KEYS.ENTER) {
		window.location.reload();
	}
});

arcanoid.paddle = {
	x: 460,
	y: 500,
	width: 104,
	height: 24,
	dx: 0,
	velocity: 10,
	ball: arcanoid.ball,
	startBallfromPaddle() {
		if (this.ball) {
			this.ball.startBall();
			this.ball = null;
			timer = setInterval(initTimer, 1000);
		}
	},
	movePaddle() {
		if (this.dx) {
			this.x += this.dx;
			if (this.ball) {
				this.ball.x += this.dx;
			}
		}
	},
	startPaddle(direction) {
		if (direction === KEYS.LEFT || direction === KEYS.KEY_A) {
			this.dx = -this.velocity;
		} else if (direction === KEYS.RIGHT || direction === KEYS.KEY_D) {
			this.dx = this.velocity;
		}
	},
	stopPaddle() {
		this.dx = 0;
	},
	getTouchOffset(x) {
		let diff = (this.x + this.width) - x;
		let offset = this.width - diff;
		let result = 2 * offset / this.width;
		return result - 1;
	},
	bounceGameBorder() {
		let x = this.x + this.dx;

		let paddleBorderLeft = x;
		let paddleBorderRight = paddleBorderLeft + this.width;
		let gameBorderLeft = 0;
		let gameBorderRight = arcanoid.widthGameSpace;

		if (paddleBorderLeft < gameBorderLeft || paddleBorderRight > gameBorderRight) {
			this.dx = 0;
		}
	},
};

//* =========== MODALS ===========================================================

const modal = document.querySelectorAll('.modal'),
	//modalBody = document.querySelector('.modal__body'),
	modalClose = document.querySelectorAll('.modal__close'),
	// modalCloseRules = document.querySelector('.close-rules'),
	// modalCloseTop = document.querySelector('.close-top'),
	modalRules = document.querySelector('.modal-rules'),
	modalTop = document.querySelector('.modal-top'),
	modalOpenRules = document.querySelector('.game__rules'),
	modalOpenTop = document.querySelector('.game__top > span'),
	modalTopList = document.querySelector('.modal-top__list');

function openModal(popup) {
	popup.classList.add('modal-show');
	popup.classList.remove('modal-hide');
	document.body.classList.toggle('lock');
}

function closeModal(popup) {
	popup.classList.add('modal-hide');
	popup.classList.remove('modal-show');
	document.body.classList.toggle('lock');
}

modalOpenRules.addEventListener('click', () => {
	openModal(modalRules);
});
modalOpenTop.addEventListener('click', () => {
	openModal(modalTop);
});

modalClose.forEach(item => {
	item.addEventListener('click', () => {
		modal.forEach(mod => closeModal(mod));
	});
});

modal.forEach(item => {
	item.addEventListener('click', (e) => {
		if (e.target === item.querySelector('.modal__body')) {
			closeModal(item);
		}
	});
});

document.addEventListener('keydown', (e) => {
	modal.forEach(item => {
		if (e.code === 'Escape' && item.classList.contains('modal-show')) {
			closeModal(item);
		}
	})
});

//* =========== Top-10 ===========================================================
let keys = Object.keys(localStorage);

for (const key in localStorage) {
	if (!Number.isFinite(+localStorage[key])) {
		localStorage.removeItem(key);
	}
}

keys.sort((a, b) => localStorage[a] - localStorage[b]);

let topPlayers = keys.splice(0, 10);

for (let i = 0; i < 10; i++) {
	let elem = document.createElement('p');

	if (topPlayers[i] === undefined) {
		elem.innerHTML = `<span>${i + 1}.</span> ------ <span>**</span> `;
		modalTopList.append(elem);
	} else {
		let playerName = '';
		if (topPlayers[i].length >= 10) {
			playerName = `${topPlayers[i].substring(0, 10)}...`;
		} else {
			playerName = topPlayers[i];
		}

		elem.innerHTML = `<span> ${i + 1}. ${playerName}</span> <span>${localStorage.getItem(topPlayers[i])}</span>`;
		modalTopList.append(elem);
	}
}
//* =========== FORM-player =======================================================
const player = document.querySelector('.player'),
	playerForm = player.querySelector('.player__form'),
	playerInput = player.querySelector('.player__input');

playerForm.addEventListener('submit', () => {
	playerName = playerInput.value;
	localStorage.setItem(playerName, time);
});

//* =========== AUDIO-background ======================================================
const audioBg = document.querySelector('.audio-background'),
	audioTriger = document.querySelector('.game__bg-sound'),
	audioIndicator = document.querySelector('.game__bg-sound > span');

let isPlay = true;
function bgMusicPlay() {
	isPlay = true;
	audioBg.play();
	audioIndicator.textContent = 'ON';
	audioTriger.classList.toggle('active');
}

function bgMusicPause() {
	isPlay = false;
	audioBg.pause();
	audioIndicator.textContent = 'OFF';
	audioTriger.classList.toggle('active');
}
audioTriger.addEventListener('click', () => {
	if (isPlay) {
		bgMusicPause();
	} else {
		bgMusicPlay();
	}
});

audioBg.addEventListener('ended', function () {
	this.currentTime = 0;
	this.play();
}, false);

audioBg.play();

//* =========== START GAME ======================================================
window.addEventListener("load", () => {
	arcanoid.start();
});