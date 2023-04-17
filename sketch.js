
let scl, initD, initN, depth;
let baseNum;
let loading = false;
let constellationMode = false;
let animationMode = true;
let inkMode = false;

let points;
let counter;
let counterMax, counterInc;
let rows, cols;

let instructionContainer, instructionWindow, closeButton, guideTitle, guideList,
  baseNumberInput, scaleNumberInput, depthNumberInput,
  horizontalStep, verticalStep, leftButton, rightButton, downButton, upButton,
  animationCheckbox, constellationCheckbox, inkCheckbox,
  saveButton, resetButton, randomizeButton;
let instructionWindowHidden = true;
let guideHidden = true;

//TODO
//Create second canvas for hi res printing
//try google font
//impliment WEBGL check and fine tune shaders

let graphics;
let useShader = true
function setup() {
  
  const mode = useShader ? WEBGL : P2D
  createCanvas(windowWidth, windowHeight, mode);

  if (useShader) {
    paintShader = new p5.Shader(_renderer, vertexShader, fragmentShader);
    shader(paintShader)

    paintShader.setUniform("rando", random())
  }

  graphics = createGraphics(width, height);
  graphics.colorMode(HSL)

  resetParams()
  initParams();


  instructionContainer = document.getElementById("instructionContainer");
  instructionWindow = document.getElementById("instructionWindow");
  guideTitle = document.getElementById("guideTitle");
  guideList = document.getElementById("guideList");
  closeButton = document.getElementById("closeButton");
  baseNumberInput = document.getElementById("baseNumberInput");
  leftButton = document.getElementById("leftButton")
  rightButton = document.getElementById("rightButton")
  downButton = document.getElementById("downButton")
  upButton = document.getElementById("upButton")
  horizontalStep = document.getElementById("horizontalStep")
  verticalStep = document.getElementById("verticalStep")
  scaleNumberInput = document.getElementById("scaleNumberInput")
  depthNumberInput = document.getElementById("depthNumberInput")
  animationCheckbox = document.getElementById("animationCheckbox")
  constellationCheckbox = document.getElementById("constellationCheckbox")
  inkCheckbox = document.getElementById("inkCheckbox")
  saveButton = document.getElementById("saveButton")
  resetButton = document.getElementById("resetButton")
  randomizeButton = document.getElementById("randomizeButton")

  instructionContainer.className = "out";

  guideList.className = "hidden";

  guideTitle.onclick = () => handleGuideToggle();
  
  closeButton.onclick = () => handleMenuToggle();

  leftButton.onclick = () => handleMoveLeft()
  rightButton.onclick = () => handleMoveRight();
  downButton.onclick = () => handleMoveDown();
  upButton.onclick = () => handleMoveUp();

  baseNumberInput.onchange = e => {
    baseNum = Number(e.target.value)
    dbMakeGrid()
  }

  scaleNumberInput.onchange = e => {
    scl = round(Number(e.target.value))
    dbMakeGrid()
  }

  depthNumberInput.onchange = e => {
    depth = Number(e.target.value)
    dbMakeGrid()
  }

  animationCheckbox.onchange = e => handleAnimationToggle();
  constellationCheckbox.onchange = e => handleConstellationToggle();
  inkCheckbox.onchange = e => handleInkToggle()

  saveButton.onclick = () => handlePrint()
  resetButton.onclick = () => handleReset()
  randomizeButton.onclick = () => handleRandomize()

  initUI()
}

function initUI() {
  baseNumberInput.value = baseNum;
  baseNumberInput.step = depth;

  horizontalStep.textContent = initD;
  verticalStep.textContent = initN;

  scaleNumberInput.value = scl;
  depthNumberInput.value = depth;

  animationCheckbox.checked = animationMode
  constellationCheckbox.checked = constellationMode
}

function draw() {
  if (counter < counterMax && loading == false) {
    drawGrid()
  } 

  //Shader code
  if (useShader) {
    paintShader.setUniform("texture", graphics)
    rect(-width / 2, -height / 2, width, height);
  } else {
    image(graphics, 0, 0, width, height)
  } 
}

function resetParams() {
  scl = 3
  initD = 0;
  initN = 0;
  depth = 0.25
}

function initParams() {
  baseNum = floor(randomGaussian(0, 1000))

  counterInc = radians(1)
  counterMax = TWO_PI - radians(1)
  makeGrid()
}

function getRadius() {
  const base = min(height, width)
  const div = scl;
  return base / div * 0.35
}

function drawGrid() {
  graphics.noFill();
  
  const radius = getRadius()


  points.forEach((p) => {
    const d = baseNum + p.d
    const n = baseNum + p.n

    
    const getVector = (i) => {
      let k = i * d;
      let r = radius * sin(n * k);
      let x = p.x + r * cos(k);
      let y = p.y + r * sin(k);
      return createVector(x, y);
    }
    const drawLine = (i) => {
      const v1 = getVector(i)
      const v2 = getVector(i + counterInc)

      if (constellationMode) {
        graphics.strokeWeight(constrain(5 - scl, 1, 5));
        if (inkMode) {
          graphics.stroke(240, 50, 5);
        } else {
          graphics.stroke(60, 50, 99);
        }
        graphics.point(v1.x, v1.y)
      } else {
        graphics.strokeWeight(1);
        if (inkMode) {
          graphics.stroke(240, 50, 1, 0.5);
        } else {
          graphics.stroke(60, 50, 99, 0.5);
        }
        graphics.line(v1.x, v1.y, v2.x, v2.y)
      }
    }
    if (animationMode) {
      drawLine(counter)
    } else {
      for (let i = 0; i < counterMax; i += counterInc) {
        drawLine(i)
        counter += counterInc
      }
    }
  })
  if (animationMode) counter += counterInc;
}

function makeGrid() {

  loading = true
  points = [];
  if (inkMode) {
    graphics.background(60, 50, 99);
  } else {
    graphics.background(240, 50, 1);
  }
  if (useShader) {
    paintShader.setUniform("inkMode", inkMode)
    paintShader.setUniform("resolution", [width, height]);
  }

  // grid
  rows = scl;
  cols = max(floor((width / height * scl)), 1);

  const gw = width - height * 0.1
  const gh = height - height * 0.1
  //cell
  cw = gw / cols;
  ch = gh / rows;
  //margin
  const mx = (width - gw) * 0.5;
  const my = (height - gh) * 0.5

  const yNudge = ch / 2
  const xNudge = cw / 2
  for (let y = 0; y < rows; y++) {
    let gy = yNudge + my + y * ch;
    for (let x = 0; x < cols; x++) {
      let gx = xNudge + mx + x * cw;

      const index = x + y * cols;

      let d = (index % cols) * depth;
      let n = (floor(index / cols)) * -depth;

      n -= d

      d += initD
      n += initN

      const p = createVector(gx, gy);
      p.d = d;
      p.n = n;
      points.push(p)
    }
  }
  loading = false
  counter = 0
}

function debounce(func, wait) {
  let timeout;

  return function(...args) {
    const context = this;
    const later = function() {
      timeout = null;
      func.apply(context, args);
    };

    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

const deboucedMakeGrid = debounce(makeGrid, 250);
const dbMakeGrid = () => {
  loading = true
  deboucedMakeGrid()
}

function handleMenuToggle() { 
  if (instructionWindowHidden) {
    instructionContainer.className = "in"
    instructionWindowHidden = false
  } else {
    instructionContainer.className = "out"
    instructionWindowHidden = true
  }
}
function handleGuideToggle() {
  guideHidden = !guideHidden;

  if (guideHidden) {
    guideButton.className = ""
    guideList.className = "hidden";
  } else {
    guideButton.className = "open"
    guideList.className = "notHidden";
  }
}

function handlePrint() {
// create larger canvas and save a hi-res version from there
}

function handleAnimationToggle() {
  animationMode = !animationMode

  animationCheckbox.checked = animationMode
  dbMakeGrid()
}
function handleConstellationToggle() {
  constellationMode = !constellationMode

  constellationCheckbox.checked = constellationMode
  dbMakeGrid()
}

function handleInkToggle() {
  inkMode = !inkMode;

  inkCheckbox.checked = inkMode;

  dbMakeGrid()
}

function handleReset() {
  resetParams()
  initParams()
  initUI()
  dbMakeGrid()
}

function handleRandomize() {
  initParams()
  initUI()
}

function handleScaleOut() {
  scl++
  scaleNumberInput.value = scl;
  dbMakeGrid()
}

function handleScaleIn() {
  if (scl <= 1) return
  scl--
  scaleNumberInput.value = scl;
  dbMakeGrid()
}

function handleDepthOut() {
  depth *= 2;
  depthNumberInput.value = depth
  dbMakeGrid()
}

function handleDepthIn() {
  depth /= 2;
  depthNumberInput.value = depth
  dbMakeGrid()
}

function handleMoveLeft() {
  initD += depth
  initN -= depth
  horizontalStep.textContent = initD;
  dbMakeGrid()
}

function handleMoveRight() {
  initD -= depth
  initN += depth
  horizontalStep.textContent = initD;
  dbMakeGrid()
}

function handleMoveDown() {
  initN += depth
  verticalStep.textContent = initN;
  dbMakeGrid()
}
function handleMoveUp() {
  initN -= depth
  verticalStep.textContent = initN;
  dbMakeGrid()
}


function keyPressed() {
  // If you hit the s key, save an image
  if (key == 's') save("Maurer Expanse.png");
  if (key == 'p') handlePrint();
  if (key == "m" || keyCode === ESCAPE) handleMenuToggle()
  if (key == 'r') handleRandomize();
  if (key == 'c') handleConstellationToggle();
  if (key == 'a') handleAnimationToggle();
  if (key == "i") handleInkToggle();
  if (key == 'q') handleReset();
  if (key == "-" || key == "_") handleScaleOut();
  if (key == "+" || key == "=") handleScaleIn();
  if (key == "[" || key == "{") handleDepthOut();
  if (key == "]" || key == "}") handleDepthIn();

  if (!instructionWindowHidden) return;
  //No key board commands past here when instruction window open
  if (keyCode === LEFT_ARROW) handleMoveLeft();
  if (keyCode === RIGHT_ARROW) handleMoveRight();
  if (keyCode === DOWN_ARROW) handleMoveDown();
  if (keyCode === UP_ARROW) handleMoveUp();
}

let lastTouchTime = 0;
let initialDistance = 0;
let currentDistance = 0;
let longTouchTimeout;
let touchStartPos = null;
let touchEndPos = null;

const minSwipeDistance = 50;
const doubleTapInterval = 300; // Time in milliseconds between taps to be considered a double tap

function handlePatternTap() {
  if (!instructionWindowHidden) return;
  for (let i = 0; i < points.length; i++) {
    const p = points[i];
    const dist = p.dist(createVector(mouseX, mouseY));
    const radius = getRadius();

    if (dist <= radius) {
      initD = p.d;
      initN = p.n;

      horizontalStep.textContent = initD;
      verticalStep.textContent = initN;
      dbMakeGrid();
      return;
    }
  }
}

function touchStarted() {
  if (!instructionWindowHidden) return;
  let currentTime = millis();
  console.log("🚀 ~ file: sketch.js:444 ~ touchStarted ~ touches:", touches)

  if (touches && touches.length >= 2) { //handle pinch zoom
    initialDistance = dist(touches[0].x, touches[0].y, touches[1].x, touches[1].y);
  } else if (currentTime - lastTouchTime < doubleTapInterval) { //handle double tap
    handleMenuToggle()
    clearTimeout(longTouchTimeout);
  } else {
    //handle long touch
    longTouchTimeout = setTimeout(() => {
      if (millis() - lastTouchTime > doubleTapInterval) {
        handlePatternTap(mouseX, mouseY);
      }
    }, doubleTapInterval);

    //handle swipe
    touchStartPos = createVector(mouseX, mouseY);
  }

  //double tap vars
  lastTouchTime = currentTime;
  return false
}

function touchMoved() {
  if (!instructionWindowHidden) return;

  if (touches.length >= 2) { //handle pinch zoom
    currentDistance = dist(touches[0].x, touches[0].y, touches[1].x, touches[1].y);
  }
  return false;
}

function touchEnded() {
  clearTimeout(longTouchTimeout);

  if (!instructionWindowHidden) return;

  //Handle pinch to zoom
  if (currentDistance && initialDistance) {
    if (currentDistance > initialDistance) {
      handleScaleIn()
    } else {
      handleScaleOut()
    }
  } else if (touchStartPos) { //handle swipe
    touchEndPos = createVector(mouseX, mouseY);
    
    const swipeVector = p5.Vector.sub(touchEndPos, touchStartPos);
    const swipeDistance = swipeVector.mag();
    if (swipeDistance >= minSwipeDistance) {
      if (abs(swipeVector.x) > abs(swipeVector.y)) {
        if (swipeVector.x > 0) handleMoveRight();
        else handleMoveLeft();
      } else {
        if (swipeVector.y > 0) handleMoveDown();
        else handleMoveUp();
      }
    }
  }
  
  //reset touch variables
  touchPoints = [];
  initialDistance = 0;
  currentDistance = 0;
  touchStartPos = null;
  touchEndPos = null;
  return false;
}

const vertexShader = `
attribute vec3 aPosition;
attribute vec2 aTexCoord;

varying vec2 vTexCoord;

void main() {
  vTexCoord = aTexCoord;
  vec4 positionVec4 = vec4(aPosition, 1.0);
  positionVec4.xy = positionVec4.xy * 2.0 - 1.0;
  
  gl_Position = positionVec4;
}
`;

const fragmentShader = `
#ifdef GL_ES
precision mediump float;
#endif

varying vec2 vTexCoord;

uniform vec2 resolution;
uniform sampler2D texture;
uniform bool inkMode;

uniform float rando;

float sRandom(vec2 st) {
  return fract(sin(dot(st, vec2(12.9898, 78.233))) * 43758.5453);
}

float pattern(vec2 uv) {
  float scale = 3.0 * ((resolution.y + resolution.x) / 100.0);
  float line_width = 0.1;
  vec2 grid = fract(uv * scale);
  float dOff = sRandom(uv) * 0.6;
  float diagonal = abs(grid.x - grid.y - dOff);

  float off = 1.0 - sRandom(uv * 2.0) * 0.2;
  float anti_diagonal = abs(grid.x + grid.y - off);

  float mult = inkMode ? -1.0 : 1.0;

  float lines = min(diagonal, anti_diagonal) * mult;

  return smoothstep(line_width, -line_width, lines);
}

vec2 wave(vec2 uv, float frequency, float amplitude, float r) {
  float f = frequency;
  
  float xFac = sRandom(vec2(r, uv.y*0.000001)) * 50.0;
  float yFac = sRandom(vec2(uv.x*0.000001, r)) * 50.0;
    
  vec2 blockFactor = vec2(xFac,yFac);
  float yOff = sin(uv.x * f + yFac) * amplitude;
  
  return vec2(0.0, yOff);
}

void main() {
  vec2 uv = vTexCoord;
  uv.y = 1.0 - uv.y;
  vec2 pixel_uv = uv ;

  pixel_uv += wave(pixel_uv, 500.0, 0.0005, rando) + wave(pixel_uv, 100.0, 0.001, rando*5.0);

  float canvas_texture = pattern(pixel_uv);
  vec4 canvas_col = vec4(vec3(canvas_texture), 1.0);

  vec4 image = texture2D(texture, uv);

  gl_FragColor = mix(canvas_col, image, 0.9); 

  float noise = 0.0;

  float base = inkMode ? 0.6 : 0.4;
  noise = (base - sRandom(vec2(uv.x*25.0, uv.y*0.0075)+rando))*0.3;

  gl_FragColor.r += noise;
  gl_FragColor.g += noise;
  gl_FragColor.b += noise;
}
`;
