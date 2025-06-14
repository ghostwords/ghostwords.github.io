/* globals Hammer:true, Mousetrap:true, Stats:true */
/* exported setup, update */

let MAX_ACCEL = 20,
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
	movementKeys = ['up', 'down', 'left', 'right'],

	canvasCtx, canvas_width, canvas_height,

	stats = new Stats();

function scaleInt(num, old_min, old_max, new_min, new_max) {
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
	canvasCtx.clearRect(0, 0, canvas_width, canvas_height);
}

function intersects(o1, o2) {
	let o1_x1 = o1.x,
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

// http://bost.ocks.org/mike/shuffle/
function shuffle(array) {
	let m = array.length, t, i;

	// while there remain elements to shuffle ...
	while (m) {
		// pick a remaining element ...
		i = Math.floor(Math.random() * m--);

		// and swap it with the current element
		t = array[m];
		array[m] = array[i];
		array[i] = t;
	}

	return array;
}

// general setup
let box = {
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

let wave = {
	distortHeight: function (wave_val) {
		return wave.size * (1 + Math.abs(wave_val));
	},
	fillStyle: function (wave_val) {
		return "rgba(" + scaleInt(wave_val, -1, 1, 255, 0) + ", 0, 0, 0.5)";
	},
	margin: canvas_height / 4,
	period: -3.0,
	size: 4,
	waveFunc: function (i) {
		return Math.tan(tick / 200 + (i / wave.period));
	}
};
let wave2 = {
	fillStyle: "rgba(0, 0, 200, 0.5)",
	size: 5,
	spacing: 10,
	waveFunc: function () {
		return Math.cos(tick / 50);
	}
};
let wave3 = {
	distortWidth: function (wave_val) {
		return wave3.size / (1 + Math.abs(wave_val));
	},
	distortHeight: function (wave_val) {
		return wave3.size * (1 + Math.abs(wave_val));
	},
	fillStyle: function (wave_val) {
		return "rgba(" + scaleInt(wave_val, -1, 1, 0, 255) + ", 0, " + scaleInt(wave_val, -1, 1, 255, 0) + ", 0.2)";
	},
	margin: canvas_height / 2,
	size: 57,
	waveFunc: function (i) {
		return Math.cos(tick / 50 + (i / -0.16));
	}
};

let shapes = [
	[
		'**',
		' **'
	],
	[
		' **',
		'**'
	],
	[
		'****',
	],
	[
		'*',
		'***'
	],
	[
		'  *',
		'***'
	],
	[
		'**',
		'**'
	]
];

function setup(ctx, width, height) {
	canvasCtx = ctx;
	canvas_width = width;
	canvas_height = height;

	// mousing
	ctx.canvas.addEventListener("mousemove", function (e) {
		if (intersects({
			x: e.clientX,
			y: e.clientY
		}, box)) {
			ctx.canvas.style.cursor = 'pointer';
		} else {
			ctx.canvas.style.cursor = '';
		}
	});

	// touching
	let mc = new Hammer(ctx.canvas, {
		recognizers: [[Hammer.Pan, { direction: Hammer.DIRECTION_ALL }]],
		threshold: 0
	});
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
	for (let key of Object.keys(keys)) {
		Mousetrap.bind(key, function () {
			keys[key] = true;
		}, 'keydown');
		Mousetrap.bind(key, function () {
			keys[key] = false;
		}, 'keyup');
	}
	Mousetrap.bind('r', function () {
		draw();
	});
	Mousetrap.bind('space', function () {
		pause = !pause;
	});

	// FPS counter
	stats.domElement.style.position = 'absolute';
	stats.domElement.style.right = '0px';
	stats.domElement.style.top = '0px';
	document.body.appendChild(stats.domElement);

	resize_and_recenter_box();
	window.addEventListener("resize", resize_and_recenter_box);
}

function drawWave(wave) {
	let fill_style_func = false,
		margin = wave.margin || 0,
		spacing = wave.spacing || 0;

	if (Object.prototype.toString.call(wave.fillStyle) === "[object String]") {
		canvasCtx.fillStyle = wave.fillStyle;
	} else if (typeof wave.fillStyle == 'function') {
		fill_style_func = true;
	}

	for (let i = 0; i < (canvas_width / (wave.size + spacing)); i++) {
		let wave_val = wave.waveFunc(i);

		if (fill_style_func) {
			canvasCtx.fillStyle = wave.fillStyle(wave_val, i);
		}

		canvasCtx.fillRect(
			spacing + i * (wave.size + spacing), // x
			scaleInt(wave_val, -1, 1, margin, canvas_height - wave.size - margin), // y
			(wave.distortWidth ? wave.distortWidth(wave_val, i) : wave.size), // width
			(wave.distortHeight ? wave.distortHeight(wave_val, i) : wave.size)  // height
		);
	}
}

function drawShape(shape, shape_num) {
	let size = canvas_height / 4 / shapes.length,
		shapes_width = size * 4,
		shapes_height = shapes.length * size * 3;

	canvasCtx.fillStyle = "rgb(255, 255, 255)";

	shape.forEach(function (row, i) {
		row.split('').forEach(function (item, j) {
			if (item == '*') {
				canvasCtx.fillRect(
					((canvas_width - shapes_width) / 2) + (j * size),
					((canvas_height - shapes_height) / 2) + ((i + (shape.length == 1 ? 1 : 0)) * size) + (shape_num * size * 3),
					size,
					size
				);
			}
		});
	});
}

function draw() {
	drawWave(wave3);
	drawWave(wave2);

	// the box
	canvasCtx.fillStyle = "rgb(" + Math.floor(200 / MAX_ACCEL * box.accel) + ", 0, 0)";
	canvasCtx.fillRect(box.x, box.y, box.width, box.height);

	if (tick % 20 === 0) {
		shapes = shuffle(shapes);
	}
	shapes.forEach(drawShape);

	drawWave(wave);
}

function update(ctx, width, height/*, time*/) {
	canvasCtx = ctx;
	canvas_width = width;
	canvas_height = height;

	if (pause) {
		tick++;
		return;
	}

	stats.begin();

	Object.keys(keys).forEach(function (key) {
		if (!keys[key]) { // active?
			return;
		}

		if (movementKeys.indexOf(key) != -1) {
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
			wave.period += 0.01;
		} else if (key == 'd') {
			wave.period -= 0.01;
		}
	});

	if (!movementKeys.some(function (key) {
		return keys[key];
	})) {
		deccelerate();
	}

	clearDisplay();

	draw();

	// bookkeeping
	tick++;

	stats.end();
}
