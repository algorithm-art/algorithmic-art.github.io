'use strict';

const backgroundElement = document.body;
const backgroundGenerators = new Map();
let bgGenerator, backgroundRedraw;
let bgGeneratorRotation = 0;

const canvas = document.getElementById('background-canvas');
canvas.getContext('2d').save();

function rotateCanvas(context, width, height, rotation) {
		context.translate(width / 2, height / 2);
		context.rotate(rotation);
		context.translate(-width / 2, -height / 2);
}

function generateBackground() {
	canvas.width = window.innerWidth;
	canvas.height = window.innerHeight;
	progressiveBackgroundGen(bgGenerator, 0);
}

const bgGeneratorImage = new Image();
bgGeneratorImage.onload = generateBackground;

const signatureFont = 'italic 20px "Pacifico", cursive';
let signatureWidth, signatureHeight;
let author = '';

function drawSignature(context, backgroundColor) {
	context.setTransform(1, 0, 0, 1, 0, 0);
	context.globalCompositeOperation = 'source-over';
	context.font = signatureFont;
	context.textAlign = 'left';
	context.textBaseline = 'bottom';
	const text = 'Elizabeth Hudnott' + (author === '' ? '' : ' & ' + author);
	const metrics = context.measureText(text);
	const paddingX = 3;
	const paddingY = 4;
	signatureWidth = 2 * paddingX + Math.ceil(metrics.actualBoundingBoxRight);
	signatureHeight = paddingY + Math.ceil(metrics.actualBoundingBoxAscent);
	const canvasHeight = context.canvas.height;
	if (backgroundColor === undefined) {
		context.clearRect(0, canvasHeight - signatureHeight, signatureWidth, signatureHeight);
		backgroundColor = backgroundElement.style.backgroundColor;
	} else {
		context.fillStyle = backgroundColor;
		context.fillRect(0, canvasHeight - signatureHeight, signatureWidth, signatureHeight);
	}
	const [colorSystem, colorComponents] = parseColor(backgroundColor);
	const luma = colorSystem === 'rgb' ?  rgbToLuma(...colorComponents) : colorComponents[2] / 100;
	context.fillStyle = luma >= 0.5 ? 'black' : 'white';
	context.fillText(text, paddingX, canvasHeight);
}

function progressiveBackgroundDraw(generator, context, width, height, preview) {
	const redraw = generator.generate(context, width, height, preview);
	backgroundRedraw = redraw;
	let done = false;
	function drawSection() {
		if (backgroundRedraw === redraw) {
			done = redraw.next().done;
			if (done) {
				if (document.fonts.check(signatureFont)) {
					drawSignature(context);
				} else {
					document.fonts.load(signatureFont).then(function () {
						drawSignature(context);
					});
				}
			} else {
				setTimeout(drawSection, 0);
			}
		}
	}
	drawSection();
}

function progressiveBackgroundGen(generator, preview) {
	const context = canvas.getContext('2d');
	const width = canvas.width;
	const height = canvas.height;
	context.restore();
	context.clearRect(0, 0, width, height);
	context.save();
	rotateCanvas(context, width, height, bgGeneratorRotation);
	progressiveBackgroundDraw(generator, context, width, height, preview);
}

function showBackgroundOptions() {
	$('#video-modal').modal('hide');
	$('#error-alert').alert('close');
	$('#background-gen-modal').modal('show');
}

{
	const urlParameters = new URLSearchParams(document.location.search);
	const backgroundGenOptionsDOM = new Map();
	let bgGeneratorName, startFrame, endFrame, animController;
	let fullRotations = 0;

	const instructions = $('#instructions-alert');
	const errorAlert = $('#error-alert');
	const successAlert = $('#success-alert');
	const videoErrorAlert = $('#video-error');

	const authorForm = document.getElementById('author-form');
	const authorInput = document.getElementById('author');

	const modal = document.getElementById('background-gen-modal');
	const modalHeader = document.getElementById('background-gen-modal-header');
	const progressBar = document.getElementById('video-progress');
	const imageUpload = document.getElementById('background-gen-image');
	imageUpload.remove();
	imageUpload.removeAttribute('hidden');

	const animPositionSlider = document.getElementById('anim-position');
	const videoResolutionInput = document.getElementById('video-resolution');

	class FrameData {
		constructor(generator, rotation, backgroundElement) {
			this.continuous = new Map();
			this.stepped = new Map();
			if (generator.animatable) {
				for (let property of generator.animatable[0]) {
					let value = generator[property];
					if (Array.isArray(value)) {
						value = value.slice();
					}
					this.continuous.set(property, value);
				}
				for (let property of generator.animatable[1]) {
					let value = generator[property];
					if (Array.isArray(value)) {
						value = value.slice();
					}
					this.stepped.set(property, value);
				}
			}
			this.rotation = rotation;
			this.backgroundColor = backgroundElement.style.backgroundColor;
		}

	}

	function hideAlert(jquery) {
		jquery.alert('close');
	}

	function showAlert(jquery, message, parent) {
		const elem = jquery.get(0);
		elem.children[0].innerHTML = message;
		elem.classList.add('show');
		parent.appendChild(elem);
		clearTimeout(elem.timeout);
		elem.timeout = setTimeout(hideAlert, 6000, jquery);
	}

	function backgroundGeneratorFactory(name) {
		let generator = backgroundGenerators.get(name);
		if (generator === undefined) {
			return injectScript(name + '.js').then(function () {
				return  backgroundGenerators.get(name);
			});
		} else {
			return new Promise(function (resolve, reject) {
				return resolve(generator);
			})
		}
	}

	function switchBackgroundGenerator(name) {
		backgroundGeneratorFactory(name).then(function (gen) {
			if (bgGenerator && bgGenerator.purgeCache) {
				bgGenerator.purgeCache();
			}
			bgGenerator = gen;
			const prevGenName = bgGeneratorName;
			bgGeneratorName = name;
			startFrame = new FrameData(bgGenerator, bgGeneratorRotation, backgroundElement);
			endFrame = startFrame;
			animPositionSlider.disabled = true;
			generateBackground();

			document.getElementById('background-gen-modal-label').innerHTML = gen.title + ' Options';

			function attachOptionsDOM(dom) {
				const container = document.getElementById('background-gen-options');
				const elements = dom.children;
				while (elements.length > 0) {
					container.appendChild(elements[0]);
				}
				const imageCtrlLocation = container.querySelector('[data-attach=image]');
				if (imageCtrlLocation !== null) {
					imageCtrlLocation.appendChild(imageUpload);
				}
			}

			// Switch out previous DOM
			const container = document.getElementById('background-gen-options');
			const oldDOM = backgroundGenOptionsDOM.get(prevGenName);
			if (oldDOM !== undefined) {
				const elements = container.children;
				while (elements.length > 0) {
					const oldElement = container.removeChild(elements[0]);
					oldDOM.appendChild(oldElement);
				}
			}

			// Try to get from cache first.
			const dom = backgroundGenOptionsDOM.get(name);
			if (dom !== undefined) {
				attachOptionsDOM(dom);
			} else {
				const optionsDocPromise = gen.optionsDocument;
				if (optionsDocPromise !== undefined) {
					optionsDocPromise.then(function (optionsDoc) {
						const dom = optionsDoc.body;
						attachOptionsDOM(dom);
						backgroundGenOptionsDOM.set(name, dom);
					});
				}
			}
			document.getElementById('btn-generate-background').hidden = !gen.hasRandomness;

			const credits = gen.credits ? '<hr>' + gen.credits : '';
			document.getElementById('background-gen-credits').innerHTML = credits;

			urlParameters.set('gen', name);
			let url = document.location;
			url = url.origin + url.pathname + '?' + urlParameters.toString();
			history.replaceState(null, '', url.toString());
		});
	}

	function interpolateValue(startValue, endValue, tween) {
		const type = typeof(startValue);
		if (type === 'number') {
			return (endValue - startValue) * tween + startValue;
		} else if (type === 'string') {
			const [colorSystem, startComponents] = parseColor(startValue);
			const [, endComponents] = parseColor(endValue);
			const tweened = new Array(4);
			for (let i = 0; i < 4; i++) {
				const componentStart = startComponents[i];
				const componentEnd = endComponents[i];
				tweened[i] = (componentEnd - componentStart) * tween + componentStart;
			}
			if (colorSystem === 'rgb') {
				return 'rgba(' + tweened.join(',') + ')';
			} else {
				return hsla(...tweened);
			}
		} else if (Array.isArray(startValue)) {
			const numComponents = startValue.length;
			const output = new Array(numComponents);
			for (let i = 0; i < numComponents; i++) {
				output[i] = interpolateValue(startValue[i], endValue[i], tween);
			}
			return output;
		}
	}

	function interpolateStep(startValue, endValue, tween) {
		if (tween === 1 || startValue === endValue) {
			return endValue;
		} else if (Array.isArray(startValue)) {
			const numComponents = startValue.length;
			const output = new Array(numComponents);
			for (let i = 0; i < numComponents; i++) {
				output[i] = interpolateStep(startValue[i], endValue[i], tween);
			}
			return output;
		} else if (typeof(startValue) === 'number') {
			let steps = endValue - startValue;
			if (steps > 0) {
				steps++;
			} else {
				steps--;
			}
			return Math.floor(steps * tween + startValue);
		} else {
			return tween < 0.5 ? startValue : endValue;
		}
	}

	function renderFrame(context, width, height, tween, paintBackground, preview) {
		for (let [property, startValue] of startFrame.continuous.entries()) {
			let endValue = endFrame.continuous.get(property);
			bgGenerator[property] = interpolateValue(startValue, endValue, tween);
		}
		for (let [property, startValue] of startFrame.stepped.entries()) {
			let endValue = endFrame.stepped.get(property);
			bgGenerator[property] = interpolateStep(startValue, endValue, tween);
		}

		const rotation = interpolateValue(startFrame.rotation, endFrame.rotation + TWO_PI * fullRotations, tween);
		const backgroundColor = interpolateValue(startFrame.backgroundColor, endFrame.backgroundColor, tween);

		context.restore();
		if (paintBackground) {
			context.fillStyle = backgroundColor;
			context.fillRect(0, 0, width, height);
			context.fillStyle = 'black';
		} else {
			backgroundElement.style.backgroundColor = backgroundColor;
			context.clearRect(0, 0, width, height);
		}
		context.save();
		rotateCanvas(context, width, height, rotation);
		if (preview === 0) {
			// Draw everything in one go when animating
			const redraw = bgGenerator.generate(context, width, height, 0);
			backgroundRedraw = redraw;
			let done;
			do {
				done = redraw.next().done;
			} while (!done);
			drawSignature(context, backgroundColor);
		} else {
			progressiveBackgroundDraw(bgGenerator, context, width, height, preview);
		}
	}

	function animate(context, width, height, startTween, length, capturer) {
		const paintBackground = capturer !== undefined;
		const newAnimController = new AnimationController({});
		const promise = new Promise(function (resolve, reject) {
			const indicator = document.getElementById('recording-indicator');
			let framesRendered = 0;

			function render() {
				const time = performance.now();
				let beginTime = newAnimController.beginTime;
				if (beginTime === undefined) {
					newAnimController.setup(render, reject, time);
					beginTime = time;
				}

				const tween = Math.min(startTween + (time - beginTime) / length, 1);
				newAnimController.progress = tween;
				if (newAnimController.status === 'aborted') {
					return;
				}
				renderFrame(context, width, height, tween, paintBackground, 0);

				if (capturer) {
					capturer.capture(context.canvas);
					let percent = (tween - startTween) / (1 - startTween) * 100;
					progressBar.style.width = percent + '%';
					percent = Math.trunc(percent);
					progressBar.innerHTML = percent + '%';
					progressBar.setAttribute('aria-valuenow', percent);
					framesRendered++;
					const iconFile = framesRendered % 2 === 0 ? 'record.png' : 'draw_ellipse.png';
					indicator.src = '../img/' + iconFile;
				}
				if (tween < 1) {
					requestAnimationFrame(render);
				} else {
					newAnimController.finish(resolve);
				}
			};
			newAnimController.start = render;
		});
		newAnimController.promise = promise;
		return newAnimController;
	}

	function captureVideo(context, width, height, startTween, length, properties) {
		progressBar.style.width = '0';
		progressBar.innerHTML = '0%';
		progressBar.setAttribute('aria-valuenow', '0');
		const progressRow = document.getElementById('video-progress-row');
		progressRow.hidden = false;

		const stopButton = document.getElementById('btn-stop-video-render');
		const renderButton = document.getElementById('btn-render-video');
		renderButton.disabled = true;
		stopButton.disabled = false;

		const capturer = new CCapture(properties);
		animController = animate(context, width, height, startTween, length, capturer);
		function reset() {
			stopButton.disabled = true;
			capturer.stop();
			progressRow.hidden = true;
			renderButton.disabled = false;
		}
		animController.promise = animController.promise.then(
			function () {
				capturer.save();
				$('#video-modal').modal('hide');
				reset();
			},
			reset
		);

		capturer.start();
		animController.start();
	}

	function generateFilename() {
		const now = new Date();
		const year = now.getFullYear();
		const month = String(now.getMonth() + 1).padStart(2, '0');
		const day = String(now.getDate()).padStart(2, '0');
		const hour = String(now.getHours()).padStart(2, '0');
		const minute = String(now.getMinutes()).padStart(2, '0');
		return `${bgGeneratorName} ${year}-${month}-${day} ${hour}${minute}`;
	}

	// Select a background generator based on URL.
	const firstGenName = urlParameters.get('gen') || 'ten-print';
	const generatorButtonContainer = document.getElementById('generators');
	try {
		const generatorButton = checkInput(generatorButtonContainer, 'generator', firstGenName);
		const currentSelection = generatorButtonContainer.querySelector('.active');
		if (currentSelection !== null) {
			currentSelection.classList.remove('active');
		}
		generatorButton.parentElement.classList.add('active');
	} catch (e) {
		console.log(`Loaded experimental background generator ${firstGenName}. There is no UI button for activating this generator.`)
	}
	switchBackgroundGenerator(firstGenName);

	let mouseZone;
	canvas.addEventListener('mousemove', function (event) {
		const x = event.clientX;
		const y = event.clientY;
		if (x < signatureWidth && y > canvas.height - signatureHeight) {
			if (mouseZone !== 'signature') {
				authorForm.hidden = false;
				authorInput.focus();
				mouseZone = 'signature';
			}
		} else if (mouseZone !== '') {
			mouseZone = '';
		}
	});

	authorForm.addEventListener('submit', function (event) {
		event.preventDefault();
		author = authorInput.value;
		this.hidden = true;
		progressiveBackgroundGen(bgGenerator, 0);
	});

	authorForm.addEventListener('focusout', function (event) {
		if (!this.contains(event.relatedTarget)) {
			authorForm.hidden = true;
			authorInput.value = author;
		}
	});

	// Add events for switching between background generators.
	function generatorSwitcher(event) {
		switchBackgroundGenerator(this.value);
	}

	for (let button of generatorButtonContainer.querySelectorAll('input')) {
		button.addEventListener('click', generatorSwitcher);
	}

	document.getElementById('background-rotation').addEventListener('input', function (event) {
		bgGeneratorRotation = TWO_PI * parseFloat(this.value);
		progressiveBackgroundGen(bgGenerator, 0);
	})

	// Changing background colour.
	document.getElementById('paper-color').addEventListener('input', function (event) {
		backgroundElement.style.backgroundColor = this.value;
		drawSignature(canvas.getContext('2d'));
	});

	// Animation controls
	document.getElementById('btn-start-frame').addEventListener('click', function (event) {
		startFrame = new FrameData(bgGenerator, bgGeneratorRotation, backgroundElement);
		const positionSlider = animPositionSlider
		positionSlider.value = 0;
		positionSlider.disabled = false;
		updateAnimPositionReadout(0);
		showAlert(successAlert, 'Start frame set.', document.body)
		videoErrorAlert.alert('close');
	});

	document.getElementById('btn-end-frame').addEventListener('click', function (event) {
		endFrame = new FrameData(bgGenerator, bgGeneratorRotation, backgroundElement);
		const positionSlider = animPositionSlider
		positionSlider.value = 1;
		positionSlider.disabled = false;
		updateAnimPositionReadout(1);
		showAlert(successAlert, 'End frame set.', document.body)
		videoErrorAlert.alert('close');
	});

	function updateAnimPositionReadout(tween) {
		let timeStr;
		const length = parseFloat(document.getElementById('anim-length').value);
		if (length > 0) {
			let time = tween * length;
			if (length <= 60) {
				time = Math.round(time * 10) / 10;
			} else {
				time = Math.round(time);
			}
			timeStr = time + 's';
		} else {
			timeStr = '';
		}
		document.getElementById('anim-position-readout').innerHTML = timeStr;

	}

	function animFinished() {
		const playStopButton = document.getElementById('btn-play');
		playStopButton.children[0].src = '../img/control_play_blue.png';
		playStopButton.title = 'Play animation';
		const position = animController.progress;
		animPositionSlider.value = position;
		updateAnimPositionReadout(position);
		syncToPosition();
	}

	document.getElementById('btn-play').addEventListener('click', function (event) {
		if (animController && animController.status === 'running') {
			animController.abort();
			return;
		}

		let errorMsg;
		if (startFrame === endFrame) {
			errorMsg = 'The start and end frames are the same. Nothing to animate. <button type="button" class="btn btn-primary btn-sm align-baseline" onclick="showBackgroundOptions()">Set up Animation</button>';
		} else {
			const lengthInput = document.getElementById('anim-length');
			const length = parseFloat(lengthInput.value);
			if (length > 0) {
				$(modal).modal('hide');
				this.children[0].src = '../img/control_stop_blue.png';
				this.title = 'Stop animation';
				successAlert.alert('close');
				errorAlert.alert('close');
				animController = animate(canvas.getContext('2d'), canvas.width, canvas.height, 0, length * 1000);
				animController.promise = animController.promise.then(animFinished, animFinished);
				animController.start();
			} else {
				errorMsg = 'Invalid animation duration.';
			}
		}
		if (errorMsg !== undefined) {
			showAlert(errorAlert, errorMsg, document.body);
		}
	});

	document.getElementById('anim-controls').addEventListener('click', function (event) {
		event.stopPropagation();
	})

	animPositionSlider.addEventListener('input', function (event) {
		const tween = parseFloat(this.value);
		renderFrame(canvas.getContext('2d'), canvas.width, canvas.height, tween, false, 1);
		updateAnimPositionReadout(tween);
	});

	function syncToPosition() {
		const tween = parseFloat(animPositionSlider.value);
		const startRotation = startFrame.rotation;
		const endRotation = endFrame.rotation + TWO_PI * fullRotations;
		bgGeneratorRotation = interpolateValue(startFrame, endRotation, tween);
		document.getElementById('background-rotation').value = bgGeneratorRotation / TWO_PI;
	}

	function syncAndDraw() {
		syncToPosition();
		progressiveBackgroundGen(bgGenerator, 0);
	}

	animPositionSlider.addEventListener('mouseup', syncAndDraw);
	animPositionSlider.addEventListener('keyup', syncAndDraw);

	document.getElementById('anim-length').addEventListener('input', function (event) {
		const length = parseFloat(this.value);
		if (length > 0) {
			videoErrorAlert.alert('close');
		}
	});

	document.getElementById('btn-anim-opts').addEventListener('click', function (event) {
		$('#anim-opts-modal').modal('show');
	});

	document.getElementById('background-rotations').addEventListener('input', function (event) {
		const value = parseFloat(this.value);
		if (Number.isFinite(value)) {
			fullRotations = value;
		}
	});

	function hideConfig() {
		$('#background-gen-modal').modal('hide');
	}

	$('#anim-opts-modal').on('show.bs.modal', hideConfig);
	$('#video-modal').on('show.bs.modal', hideConfig);

	{
		const currentResStr = screen.width + 'x' + screen.height;
		let currentResOption = videoResolutionInput.querySelector('option[value="' + currentResStr +'"]');
		if (currentResOption === null) {
			currentResOption = document.createElement('OPTION');
			currentResOption.value = currentResStr;
			videoResolutionInput.appendChild(currentResOption);
		}
		currentResOption.innerHTML = 'Full Screen (' + screen.height + 'p)';
		currentResOption.selected = true;
	}

	document.getElementById('btn-render-video').addEventListener('click', function (event) {
		let errorMsg = '';
		if (startFrame === endFrame) {
			errorMsg += '<p>The start and end frames are the same. Nothing to render.</p><p><button type="button" class="btn btn-primary btn-sm" onclick="showBackgroundOptions()">Set up Animation</button></p>';
		}
		let length = parseFloat(document.getElementById('anim-length').value);
		if (!(length > 0)) {
			errorMsg += '<p>Invalid video duration.</p>'
		}
		const framerate = parseInt(document.getElementById('video-framerate').value);
		if (!(framerate > 0)) {
			errorMsg += '<p>Invalid frame rate.</p>'
		}
		const motionBlur = parseInt(document.getElementById('motion-blur').value) + 1;
		if (!(motionBlur >= 1)) {
			errorMsg += '<p>Invalid number of motion blur frames.</p>';
		}
		const startTime = parseFloat(document.getElementById('video-start').value);
		if (!(startTime >= 0 && startTime < length)) {
			errorMsg += '<p>Invalid start time.</p>';
		}

		if (errorMsg === '') {

			videoErrorAlert.alert('close');
			const properties = {
				framerate: framerate,
				motionBlurFrames: motionBlur,
				format: document.getElementById('video-format').value,
				quality: parseInt(document.getElementById('video-quality').value),
				name: generateFilename(),
				workersPath: '../lib/'
			};
			const startTween = startTime / length;

			const resolutionStr = videoResolutionInput.value;
			const videoWidth = parseInt(resolutionStr);
			const videoHeight = parseInt(resolutionStr.slice(resolutionStr.indexOf('x') + 1));
			const captureCanvas = document.createElement('canvas');
			captureCanvas.width = videoWidth;
			captureCanvas.height = videoHeight;
			const context = captureCanvas.getContext('2d');
			const scale = videoHeight / screen.height;
			context.scale(scale, scale);
			context.save();
			captureVideo(context, videoWidth / scale, screen.height, startTween, length * 1000, properties);

		} else {

			const element = videoErrorAlert.get(0);
			element.innerHTML = errorMsg;
			element.classList.add('show');
			document.getElementById('video-modal-body').appendChild(element);

		}
	});

	const videoQualityReadout = document.getElementById('video-quality-readout');

	document.getElementById('video-format').addEventListener('input', function (event) {
		const qualitySlider = document.getElementById('video-quality');
		const lossy = this.value === 'webm' || this.value === 'jpg';
		qualitySlider.disabled = !lossy;
		videoQualityReadout.innerHTML = lossy ? qualitySlider.value + '%' : 'N/A';
	});

	document.getElementById('video-quality').addEventListener('input', function (event) {
		videoQualityReadout.innerHTML = this.value + '%';
	});

	document.getElementById('btn-stop-video-render').addEventListener('click', function (event) {
		animController.abort();
	});

	document.getElementById('btn-download').addEventListener('click', function (event) {
		this.download = generateFilename() + '.png';
		this.href = canvas.toDataURL();
	});

	// Generate new background button.
	document.getElementById('btn-generate-background').addEventListener('click', generateBackground);

	function removeInstructions() {
		instructions.alert('close');
	}

	document.querySelectorAll('#background-gen-toolbar button').forEach(function (item) {
		item.addEventListener('click', removeInstructions);
	})

	setTimeout(removeInstructions, 10000);

	// After resizing, generate a new background to fit the new window size.
	let resizeTimer;
	window.addEventListener('resize', function (event) {
		clearTimeout(resizeTimer);
		resizeTimer = setTimeout(generateBackground, 100);
	});

	modal.style.left = Math.max(Math.round(window.innerWidth - 508), 0) + 'px';
	let modalDrag;

	modalHeader.addEventListener('mousedown', function (event) {
		const target = event.target;
		if (target === this || target.tagName === 'H5') {
			modalDrag = [event.offsetX, event.offsetY];
		}
	});

	modalHeader.addEventListener('mouseup', function (event) {
		modalDrag = undefined;
	});

	window.addEventListener('mousemove', function (event) {
		if (modalDrag !== undefined) {
			modal.children[0].classList.remove('modal-dialog-centered');
			modal.style.left = Math.round(event.clientX - modalDrag[0]) + 'px';
			modal.style.top = Math.round(event.clientY - modalDrag[1]) + 'px';
		}
	});

	$(modal).on('show.bs.modal', function (event) {
		$('#background-gen-modal-content').collapse('show');
	});

	$(modal).on('shown.bs.modal', function (event) {
		const child = modal.children[0];
		const classList = child.classList;
		if (classList.contains('modal-dialog-centered')) {
			modal.style.left = modal.offsetLeft + 'px';
			modal.style.top = Math.round((window.innerHeight - child.children[0].clientHeight) / 2) + 'px';
			classList.remove('modal-dialog-centered');
		}
	});

	modalHeader.addEventListener('dblclick', function (event) {
		$('#background-gen-modal-content').collapse('toggle');
	});

	imageUpload.querySelector('#background-gen-image-upload').addEventListener('input', function (event) {
		const file = this.files[0];
		if (file) {
			if (bgGeneratorImage.src) {
				URL.revokeObjectURL(bgGeneratorImage.src);
			}
			bgGeneratorImage.src = URL.createObjectURL(file);
			this.parentElement.querySelector('#background-gen-image-label').innerText = file.name;
		}
	});

	clearComboboxesOnFocus();

}
