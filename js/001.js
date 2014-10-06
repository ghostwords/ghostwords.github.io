/*global Mousetrap, _, Stats */

var x = 10,
	y = 10,
	y2 = 0,
	pause = false,
	speed = 1,
	accel = 1,
	MAX_ACCEL = 20,
	keys = {
		'up': false,
		'down': false,
		'left': false,
		'right': false
	},

	canvas = $('#canvas')[0],
	width = canvas.width,
	height = canvas.height,
	ctx = canvas.getContext('2d'),

	requestAnimationFrame = window.requestAnimationFrame ||
		window.mozRequestAnimationFrame ||
		window.webkitRequestAnimationFrame ||
		window.msRequestAnimationFrame,

	stats = new Stats();

function scale_int(num, old_min, old_max, new_min, new_max) {
	return Math.round((num - old_min) * (new_max - new_min) / (old_max - old_min) + new_min);
}

function accelerate() {
	if (accel < MAX_ACCEL) {
		accel += accel * 0.04;
	}
}

function deccelerate() {
	if (accel > 1) {
		accel -= accel * 0.04;
	} else {
		accel = 1;
	}
}

function clearDisplay() {
	ctx.clearRect(0, 0, width, height);
}

// setup
stats.domElement.style.position = 'absolute';
stats.domElement.style.right = '0px';
stats.domElement.style.top = '0px';
document.body.appendChild(stats.domElement);

// keys
_.each(_.keys(keys), function (key) {
	Mousetrap.bind(key, function () {
		keys[key] = true;
	}, 'keydown');
	Mousetrap.bind(key, function () {
		keys[key] = false;
	}, 'keyup');
});
Mousetrap.bind('r', clearDisplay);
Mousetrap.bind('space', function () {
	pause = !pause;
	if (!pause) {
		requestAnimationFrame(draw);
	}
});

// gameloop
function draw() {
	stats.begin();

	if (pause) {
		stats.end();
		return;
	}

	// movement
	_.each(keys, function (active, key) {
		if (active) {
			accelerate();

			if (key == 'up') {
				y -= speed * accel;
			} else if (key == 'down') {
				y += speed * accel;
			} else if (key == 'left') {
				x -= speed * accel;
			} else if (key == 'right') {
				x += speed * accel;
			}
		}
	});
	if (!_.any(keys, function (val) { return !!val; })) {
		deccelerate();
	}

	// drawing
	clearDisplay();
	ctx.fillStyle = "rgb(" + Math.floor(200 / MAX_ACCEL * accel) + ", 0, 0)";
	ctx.fillRect(x, y, 50, 50);

	var i,
		offset = 10,
		size = 25;

	ctx.fillStyle = "rgba(200, 0, 0, 0.5)";

	for (i = 0; i < (width / (size + offset)); i++) {
		ctx.fillRect(
			offset + i * (size + offset), // x
			scale_int(Math.sin(y2 / 10 + (i / 2)), -1, 1, 100, height - size - 100), // y
			size, size // width, height
		);
	}

	size = 5;
	ctx.fillStyle = "rgba(0, 0, 200, 0.5)";

	for (i = 0; i < (width / (size + offset)); i++) {
		ctx.fillRect(
			offset + i * (size + offset), // x
			scale_int(Math.cos(y2 / 50), -1, 1, 0, height - size), // y
			size, size // width, height
		);
	}

	// bookkeeping
	y2++;

	requestAnimationFrame(draw);
	stats.end();
}
requestAnimationFrame(draw);
