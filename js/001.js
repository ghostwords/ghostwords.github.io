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

// http://bost.ocks.org/mike/shuffle/
function shuffle(array) {
	var m = array.length, t, i;

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
	distortHeight: function (wave_val) {
		return wave.size * (1 + Math.abs(wave_val));
	},
	fillStyle: function (wave_val) {
		return "rgba(" + scale_int(wave_val, -1, 1, 255, 0) + ", 0, 0, 0.5)";
	},
	margin: canvas_height / 4,
	period: -3.0,
	size: 4,
	waveFunc: function (i) {
		return Math.tan(tick / 200 + (i / wave.period));
	}
};
var wave2 = {
	fillStyle: "rgba(0, 0, 200, 0.5)",
	size: 5,
	spacing: 10,
	waveFunc: function () {
		return Math.cos(tick / 50);
	}
};
var wave3 = {
	distortWidth: function (wave_val) {
		return wave3.size / (1 + Math.abs(wave_val));
	},
	distortHeight: function (wave_val) {
		return wave3.size * (1 + Math.abs(wave_val));
	},
	fillStyle: function (wave_val) {
		return "rgba(" + scale_int(wave_val, -1, 1, 0, 255) + ", 0, " + scale_int(wave_val, -1, 1, 255, 0) + ", 0.2)";
	},
	margin: canvas_height / 2,
	size: 57,
	waveFunc: function (i) {
		return Math.cos(tick / 50 + (i / -0.16));
	}
};

var shapes = [
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

function draw_wave(wave) {
	var fill_style_func = false,
		margin = wave.margin || 0,
		spacing = wave.spacing || 0;

	if (_.isString(wave.fillStyle)) {
		ctx.fillStyle = wave.fillStyle;
	} else if (_.isFunction(wave.fillStyle)) {
		fill_style_func = true;
	}

	for (var i = 0; i < (canvas_width / (wave.size + spacing)); i++) {
		var wave_val = wave.waveFunc(i);

		if (fill_style_func) {
			ctx.fillStyle = wave.fillStyle(wave_val, i);
		}

		ctx.fillRect(
			spacing + i * (wave.size + spacing), // x
			scale_int(wave_val, -1, 1, margin, canvas_height - wave.size - margin), // y
			(wave.distortWidth ? wave.distortWidth(wave_val, i) : wave.size), // width
			(wave.distortHeight ? wave.distortHeight(wave_val, i) : wave.size)  // height
		);
	}
}

function draw_shape(shape, shape_num) {
	var size = canvas_height / 4 / shapes.length,
		shapes_width = size * 4,
		shapes_height = shapes.length * size * 3;

	ctx.fillStyle = "rgb(255, 255, 255)";

	shape.forEach(function (row, i) {
		_.each(row, function (item, j) {
			if (item == '*') {
				ctx.fillRect(
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
	clearDisplay();

	draw_wave(wave3);
	draw_wave(wave2);

	// the box
	ctx.fillStyle = "rgb(" + Math.floor(200 / MAX_ACCEL * box.accel) + ", 0, 0)";
	ctx.fillRect(box.x, box.y, box.width, box.height);

	if (tick % 20 === 0) {
		shapes = shuffle(shapes);
	}
	shapes.forEach(draw_shape);

	draw_wave(wave);
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
			wave.period += 0.01;
		} else if (key == 'd') {
			wave.period -= 0.01;
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
