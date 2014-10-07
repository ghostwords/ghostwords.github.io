/*global Hammer, Mousetrap, Stats, _ */

var MAX_ACCEL = 20,
	pause = false,
	tick = 0,

	keys = {
		'up': false,
		'down': false,
		'left': false,
		'right': false,
		'w': false,
		'a': false,
		's': false,
		'd': false
	},
	movement_keys = ['up', 'down', 'left', 'right'],

	canvas = $('#canvas')[0],
	canvas_width,
	canvas_height,
	ctx = canvas.getContext('2d'),

	requestAnimationFrame = window.requestAnimationFrame ||
		window.mozRequestAnimationFrame ||
		window.webkitRequestAnimationFrame ||
		window.msRequestAnimationFrame,

	mc = new Hammer(canvas, {
		recognizers: [[Hammer.Pan, { direction: Hammer.DIRECTION_ALL }]],
		threshold: 0
	}),

	stats = new Stats();

function resize_canvas() {
	canvas_width = canvas.width = $(window).width();
	canvas_height = canvas.height = $(window).height();
}

function scale_int(num, old_min, old_max, new_min, new_max) {
	return Math.round((num - old_min) * (new_max - new_min) / (old_max - old_min) + new_min);
}

function accelerate() {
	if (box.accel < MAX_ACCEL) {
		box.accel += box.accel * 0.04;
	}
}

function deccelerate() {
	if (box.accel > 1) {
		box.accel -= box.accel * 0.04;
	} else {
		box.accel = 1;
	}
}

function clearDisplay() {
	ctx.clearRect(0, 0, canvas_width, canvas_height);
}

function intersects(o1, o2) {
	var o1_x1 = o1.x,
		o1_x2 = o1.x + (o1.width || 1),
		o1_y1 = o1.y,
		o1_y2 = o1.y + (o1.height || 1),
		o2_x1 = o2.x,
		o2_x2 = o2.x + (o2.width || 1),
		o2_y1 = o2.y,
		o2_y2 = o2.y + (o2.height || 1);

	return o1_x1 < o2_x2 && o1_x2 > o2_x1 &&
		o1_y1 < o2_y2 && o1_y2 > o2_y1;
}

// canvas setup
resize_canvas();
$(window).resize(function () {
	resize_canvas();
	draw();
});

// general setup
var box = {
	accel: 1,
	speed: 1,

	grabbed: false,
	grab_offset_x: 0,
	grab_offset_y: 0,

	width: canvas_height / 3,
	height: canvas_height / 3,

	x: 0,
	y: 0
};
function resize_and_recenter_box() {
	box.width = canvas_height / 3;
	box.height = canvas_height / 3;
	box.x = (canvas_width - box.width) / 2;
	box.y = (canvas_height - box.height) / 2;
}
resize_and_recenter_box();
$(window).resize(resize_and_recenter_box);

var wave = {
	period: -3.0,
	size: 4
};

// mousing
$(canvas).mousemove(function (e) {
	if (intersects({
		x: e.clientX,
		y: e.clientY
	}, box)) {
		$(canvas).css('cursor', 'pointer');
	} else {
		$(canvas).css('cursor', '');
	}
});

// touching
mc.on('panstart', function (e) {
	if (intersects({
		x: e.center.x,
		y: e.center.y
	}, box)) {
		box.accel = MAX_ACCEL;
		box.grabbed = true;
		box.grab_offset_x = box.x - e.center.x;
		box.grab_offset_y = box.y - e.center.y;
	}
});
mc.on('panmove', function (e) {
	if (box.grabbed) {
		box.accel = MAX_ACCEL;
		box.x = e.center.x + box.grab_offset_x;
		box.y = e.center.y + box.grab_offset_y;
	}
});
mc.on('panend', function () {
	box.grabbed = false;
});

// keying
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
		requestAnimationFrame(gameloop);
	}
});

// FPS counter
stats.domElement.style.position = 'absolute';
stats.domElement.style.right = '0px';
stats.domElement.style.top = '0px';
document.body.appendChild(stats.domElement);

function draw() {
	clearDisplay();

	ctx.fillStyle = "rgb(" + Math.floor(200 / MAX_ACCEL * box.accel) + ", 0, 0)";
	ctx.fillRect(box.x, box.y, box.width, box.height);

	var i,
		margin = canvas_height / 4,
		spacing = 0,
		speed = 100,
		wave_val;

	for (i = 0; i < (canvas_width / (wave.size + spacing)); i++) {
		wave_val = Math.tan(tick / speed + (i / wave.period));

		ctx.fillStyle = "rgba(" + scale_int(wave_val, -1, 1, 255, 0) + ", 0, 0, 0.5)";

		ctx.fillRect(
			spacing + i * (wave.size + spacing), // x
			scale_int(wave_val, -1, 1, margin, canvas_height - wave.size - margin), // y
			wave.size, wave.size // width, height
		);
	}

	margin = 0;
	var size = 5;
	spacing = 10;
	speed = 50;
	ctx.fillStyle = "rgba(0, 0, 200, 0.5)";

	for (i = 0; i < (canvas_width / (size + spacing)); i++) {
		ctx.fillRect(
			spacing + i * (size + spacing), // x
			scale_int(Math.cos(tick / speed), -1, 1, margin, canvas_height - size - margin), // y
			size, size // width, height
		);
	}
}

function gameloop() {
	if (pause) {
		return;
	}

	stats.begin();

	_.each(keys, function (active, key) {
		if (!active) {
			return;
		}

		if (movement_keys.indexOf(key) != -1) {
			accelerate();
		}

		if (key == 'up') {
			box.y -= box.speed * box.accel;
		} else if (key == 'down') {
			box.y += box.speed * box.accel;
		} else if (key == 'left') {
			box.x -= box.speed * box.accel;
		} else if (key == 'right') {
			box.x += box.speed * box.accel;
		} else if (key == 'w') {
			wave.size++;
		} else if (key == 's') {
			if (wave.size > 1) {
				wave.size--;
			}
		} else if (key == 'a') {
			wave.period += 0.1;
		} else if (key == 'd') {
			wave.period -= 0.1;
		}
	});

	if (!_.any(movement_keys, function (key) {
		return keys[key];
	})) {
		deccelerate();
	}

	draw();

	// bookkeeping
	tick++;

	requestAnimationFrame(gameloop);
	stats.end();
}
requestAnimationFrame(gameloop);
