
let scl, initD, initN, depth;
let initScl
let currD, currN;
let loading = false;
// let constellationMode = false;
// let animationMode = true;
// let danceMode = false;
let displayMode = "animation"
let prevDisplayMode = "static";
let prevScl

const PALETTES = {
  VOID: "VOID",
  INK: "INK",
  NEON: "NEON"
}
let palette;

let points;
let mapPoints;
let counter;
let counterMax, counterInc;
let rows, cols;
let mx, my;


let instructionContainer, closeButton,
  scaleNumberInput, depthNumberInput,
  horizontalStep, verticalStep, leftButton, rightButton, downButton, upButton,
  animationCheckbox, constellationCheckbox, danceCheckbox,
  saveButton, cancelButton, randomizeButton;

let tabs = ["guide", "shortcuts", "controls", "about"]
let tabRadioButtons

let instructionWindowHidden = true;

let mainColor, bgColor;

let graphics;
let useShader = true
function setup() {

  useShader = isWebGLSupported()
  
  const mode = useShader ? WEBGL : P2D
  createCanvas(windowWidth, windowHeight, mode);
  colorMode(HSL);

  if (useShader) {
    paintShader = new p5.Shader(_renderer, vertexShader, fragmentShader);
    shader(paintShader)
  }

  graphics = createGraphics(width, height);
  graphics.colorMode(HSL)

  // const urlParams = new URLSearchParams(window.location.search);
  const existingSeed = null//urlParams.get('maurerExpanseSeed');
  const seed = existingSeed ? existingSeed : Math.floor(random() * 1000000000)
  noiseSeed(seed)
  randomSeed(seed)

  // urlParams.set('maurerExpanseSeed', seed)
  // window.history.replaceState({}, '', `${ location.pathname }?${ urlParams }`);


  palette = (Object.values(PALETTES).sort(() => random() - 0.35))[0]

  initDepth = [0.1, 1, 0.01, 2, 0.001, 10, 0.0001].sort(() => random() - 0.4)[0]
  initScl = round(random(2, 14))
  resetParams()
  initParams();


  instructionContainer = document.getElementById("instructionContainer");
  closeButton = document.getElementById("closeButton");
  leftButton = document.getElementById("leftButton")
  rightButton = document.getElementById("rightButton")
  downButton = document.getElementById("downButton")
  upButton = document.getElementById("upButton")
  horizontalStep = document.getElementById("horizontalStep")
  verticalStep = document.getElementById("verticalStep")
  scaleNumberInput = document.getElementById("scaleNumberInput")
  depthNumberInput = document.getElementById("depthNumberInput")
  staticCheckbox = document.getElementById("staticCheckbox")
  animationCheckbox = document.getElementById("animationCheckbox")
  constellationCheckbox = document.getElementById("constellationCheckbox")
  danceCheckbox = document.getElementById("danceCheckbox")
  saveButton = document.getElementById("saveButton")
  cancelButton = document.getElementById("cancelButton")
  randomizeButton = document.getElementById("randomizeButton")
  warning = document.getElementById("warning")

  tabRadioButtons = document.querySelectorAll('input[type=radio][name="tabs"]');

  instructionContainer.className = "out";

  warning.className = "hide-warning";
  
  closeButton.onclick = () => handleMenuToggle();

  leftButton.onclick = () => handleMoveLeft()
  rightButton.onclick = () => handleMoveRight();
  downButton.onclick = () => handleMoveDown();
  upButton.onclick = () => handleMoveUp();

  scaleNumberInput.onchange = e => {
    scl = round(Number(e.target.value))
    dbMakeGrid()
  }

  depthNumberInput.onchange = e => {
    depth = Number(e.target.value)
    dbMakeGrid()
  }

  tabRadioButtons.forEach(tab => tab.addEventListener('change', handleTabChange));

  staticCheckbox.onchange = e => handleModeChange(e.target.value);
  animationCheckbox.onchange = e => handleModeChange(e.target.value);
  constellationCheckbox.onchange = e => handleModeChange(e.target.value);
  danceCheckbox.onchange = e => handleModeChange(e.target.value);

  saveButton.onclick = () => handleSave()
  cancelButton.onclick = () => handleMenuToggle();
  randomizeButton.onclick = () => handleRandomize()

  initUI()
}


function initUI() {
  horizontalStep.textContent = initD;
  verticalStep.textContent = initN;

  scaleNumberInput.value = scl;
  depthNumberInput.value = depth;

}


function draw() {
  handleShowWarning()
  if (counter < counterMax && loading == false) {
    drawGrid()
  } 

  //Shader code
  if (useShader) {
    paintShader.setUniform("palette", Object.values(PALETTES).findIndex((pal) => pal === palette))
    paintShader.setUniform("resolution", [width, height]);
    paintShader.setUniform("rando", random())
    paintShader.setUniform("texture", graphics)
    rect(-width / 2, -height / 2, width, height);
  } else {
    image(graphics, 0, 0, width, height)
  } 
}

function resetParams() {
  scl = initScl
  depth = initDepth
  currD = initD
  currN = initN
}

function initParams() {
  switch (palette) {
    case PALETTES.VOID: {
      mainColor = color(60, 100, 99);
      bgColor = color(260, 100, 1);
      break;
    }
    case PALETTES.INK: { 
      mainColor = color(260, 85, 5);
      bgColor = color(60, 50, 99);
      break;
    }
    case PALETTES.NEON: {
      mainColor = color(60, 50, 100);
      const h = random(180, 320)
      bgColor = color(h, 100, 5);
      break
    }
  }

  initD = round(randomGaussian(0, 1000))
  initN = round(randomGaussian(0, 1000))
  currD = initD
  currN = initN

  counterInc = 1
  counterMax = 360
  makeGrid()
}

function getRadius(noise = 0.35) {
  const base = min(height, width)
  const div = scl;
  return base / div * noise
}

function drawGrid() {
  if (displayMode === "dance") {
    graphics.fill(bgColor)
    graphics.rect(0, 0, width, height)
  }
  points.forEach((p) => {
    const d = p.d
    const n = p.n

    const radius = p.radius ? p.radius : getRadius()

    const getVector = (i) => {
      const k = i * d * (PI / 180);
      const r = radius * sin(n * k);
      const x = p.x + r * cos(k);
      const y = p.y + r * sin(k);

      return createVector(x, y);
    }

    const drawLine = (i) => {
      graphics.noFill();
      const v1 = getVector(i)
      const v2 = getVector(i + counterInc)

      // For NEON PAllet
      const getN = (min, max, off = 0) => {
        const rat = 0.002//0.0015
        const xoff = d + ((v1.x - p.x) * scl) * rat 
        const yoff = n + ((v1.y - p.y) * scl) * rat
        return map(noise(xoff+ off, yoff  + off), 0, 1, min, max)
      }
      const median = 120
      const h = getN(median, 360+median) % 360
      const s = getN(40, 90, 100)
      const l = getN(40, 90, 200)

      const c = palette === PALETTES.NEON ? color(h, s, l) : mainColor

      if (displayMode === "constellation") {
        graphics.strokeWeight(constrain(7 - scl, 2, 7));
        c.setAlpha(1)
        graphics.stroke(c);
      } else {
        graphics.strokeWeight(1);

        const al = map(scl, 1, 5, 0.35, 0.2, true)
        c.setAlpha(al)
        graphics.stroke(c);
      }

      if (p.withLine && i < counterMax * 0.002) {
        graphics.line(p.withLine.x, p.withLine.y, p.x, p.y)
      }

      if (displayMode === "constellation") {
        graphics.point(v1.x, v1.y)
      } else {

        if (displayMode === "dance") {
          const range = 16
          const getN = (b, t) => {
            return map(noise(b*0.009, t*0.007), 0, 1, -range, range)
          }
          const v1x = v1.x + getN(v1.x, frameCount)
          const v1y = v1.y + getN(v1.y, frameCount)/2
          const v2x = v2.x + getN(v2.x, frameCount)
          const v2y = v2.y + getN(v2.y, frameCount)/2

          graphics.line(v1x, v1y, v2x, v2y)


        } else { //regular
          graphics.line(v1.x, v1.y, v2.x, v2.y)
        }
      }
    }

    if (displayMode === "animation") {
      drawLine(counter)
    } else {
      for (let i = 0; i < counterMax; i += counterInc) {
        drawLine(i)
        counter += counterInc
      }

      if (counter >= counterMax && displayMode === "dance") counter = 0;
    }
  })
  if (displayMode === "animation") counter += counterInc;
}

function makeGrid() {
  loading = true
  graphics.background(bgColor);
  
  points = [];



  // grid
  rows = scl;
  cols = max(floor((width / height * scl)), 1);

  const gw = width - height * 0.1
  const gh = height - height * 0.1
  //cell
  const cw = gw / cols;
  const ch = gh / rows;
  //margin
  mx = (width - gw) * 0.5;
  my = (height - gh) * 0.5

  const yNudge = ch / 2
  const xNudge = cw / 2

  for (let y = 0; y < rows; y++) {
    let gy = yNudge + my + y * ch;
    for (let x = 0; x < cols; x++) {
      let gx = xNudge + mx + x * cw;

      const p = createVector(gx, gy);
      
      const index = x + y * cols;

      let d, n;

      d = (index % cols) * depth;
      n = (floor(index / cols)) * depth;
      d += initD;
      n += initN;
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

function handleShowWarning() {
  if (frameRate() < 30) {
    warning.className = "show-warning"
  } else {
    warning.className = "hide-warning"
  }
}


function handleMenuToggle() { 
  if (instructionWindowHidden) {
    instructionContainer.className = "in"
    instructionWindowHidden = false
  } else {
    instructionContainer.className = "out"
    instructionWindowHidden = true
    document.activeElement.blur()
  }
}


function handleTabChange(e) { 
  const activeTab = e.target.value
  tabs.forEach(tab => { 
    const section = document.getElementById(tab)
    if (tab === activeTab) {
      section.className = "tab-active"
    } else {
      section.className = "tab-hidden"
    }
  })
}


function handleModeChange(newMode) {  
  if (newMode === displayMode) {
    //toggle back to previous mode
    displayMode = prevDisplayMode
    
    if (newMode === "dance") { 
      scl = prevScl
      scaleNumberInput.value = scl;
    }
  } else {
    if (newMode === "dance") {
      prevDisplayMode = displayMode
      prevScl = scl;
      scl = 1
      scaleNumberInput.value = scl;
    } 

    prevDisplayMode = displayMode
    displayMode = newMode
  }

  const radios = document.getElementsByName("radio-mode")
  radios.forEach(radio => { 
    if (radio.value === displayMode) radio.checked = true
  })


  dbMakeGrid()
}


function handleRandomize() {
  initParams()
  initUI()
}

function roundToPrecision(num, precision = 10000) { 
  return round((num + Number.EPSILON) * precision) / precision
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
  initD = roundToPrecision(initD + depth)
  horizontalStep.textContent = initD;
  dbMakeGrid()
}

function handleMoveRight() {
  initD = roundToPrecision(initD - depth)
  horizontalStep.textContent = initD;
  dbMakeGrid()
}

function handleMoveDown() {
  initN = roundToPrecision(initN - depth)
  verticalStep.textContent = initN;
  dbMakeGrid()
}
function handleMoveUp() {
  initN = roundToPrecision(initN + depth)
  verticalStep.textContent = initN;
  dbMakeGrid()
}

function handleSave() {
  save("Maurer Expanse.png");
}

function keyPressed() {
  // If you hit the s key, save an image
  if (key == 'p') handleSave();
  if (key == "m" || keyCode === ESCAPE) handleMenuToggle()
  if (key == 'r') handleRandomize();

  if (key == "s") handleModeChange("static");
  if (key == 'c') handleModeChange("constellation");
  if (key == 'a') handleModeChange("animation");
  if (key == 'd') handleModeChange("dance");

  if (key == "-" || key == "_") handleScaleOut();
  if (key == "+" || key == "=") handleScaleIn();
  if (key == "[" || key == "{") handleDepthOut();
  if (key == "]" || key == "}") handleDepthIn();


  // ignore arrow keys if typing in input
  if (document.activeElement.tagName === "INPUT") return;

  if (keyCode === LEFT_ARROW) handleMoveLeft();
  if (keyCode === RIGHT_ARROW) handleMoveRight();
  if (keyCode === DOWN_ARROW) handleMoveDown();
  if (keyCode === UP_ARROW) handleMoveUp();
}

function mouseInInstructionContainer() {
  if (width < 600) {
    return !instructionWindowHidden
  }
  if (mouseX > width - 430 && mouseY < 500 && !instructionWindowHidden) return true
  return false
}


let lastTouchTime = 0;
let initialDistance = 0;
let currentDistance = 0;
let longTouchTimeout;
let touchStartPos = null;
let touchEndPos = null;
let movingPos = null;

const minSwipeDistance = 50;
const doubleTapInterval = 400; // Time in milliseconds between taps to be considered a double tap

function checkNoSwipe() { 
  if (!touchStartPos || !movingPos) return true
  const swipeVector = p5.Vector.sub(movingPos, touchStartPos);
  const swipeDistance = swipeVector.mag();
  return swipeDistance < minSwipeDistance
}

function handlePatternTap() {
  if (mouseInInstructionContainer()) return
  for (let i = 0; i < points.length; i++) {
    const p = points[i];
    const dist = p.dist(createVector(mouseX, mouseY));
    const radius = getRadius();

    if (dist <= radius) {
      initD = p.d;
      initN = p.n;
      currD = initD;
      currN = initN;

      horizontalStep.textContent = initD;
      verticalStep.textContent = initN;
      dbMakeGrid();
      return;
    }
  }
}

function touchStarted() {
  if (mouseInInstructionContainer()) return
  let currentTime = millis();

  if (touches && touches.length >= 2) { //handle pinch zoom
    initialDistance = dist(touches[0].x, touches[0].y, touches[1].x, touches[1].y);
  } else if (currentTime - lastTouchTime < doubleTapInterval) {
    //handle double tap
    handlePatternTap(mouseX, mouseY);
  } else {
    //handle long touch
    longTouchTimeout = setTimeout(() => {
      if (millis() - lastTouchTime > doubleTapInterval) {
        if (checkNoSwipe()) handleModeChange("dance");
        clearTimeout(longTouchTimeout);
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
  if (mouseInInstructionContainer()) return

  movingPos = createVector(mouseX, mouseY);

  if (touches.length >= 2) { //handle pinch zoom
    currentDistance = dist(touches[0].x, touches[0].y, touches[1].x, touches[1].y);
  }
  return false;
}

function touchEnded() {
  clearTimeout(longTouchTimeout);

  if (mouseInInstructionContainer()) return

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
      if (touchStartPos.x > width - (mx*2) && touchStartPos.y < my*2) {
        handleMenuToggle()
      } else if (abs(swipeVector.x) > abs(swipeVector.y)) {
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

function isWebGLSupported() {
  try {
    const canvas = document.createElement('canvas');
    return !!(window.WebGLRenderingContext && (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')));
  } catch (e) {
    return false;
  }
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
uniform int palette;

bool inkMode = palette == 1;

uniform float rando;

float sRandom(vec2 st) {
  return fract(sin(dot(st, vec2(12.9898, 78.233))) * 43758.5453);
}

float pattern(vec2 uv) {
  float scale = 3.0 * ((resolution.y + resolution.x) / 100.0);
  float line_width = 0.1;
  vec2 grid = fract(uv * scale);
  float dOff = sRandom(uv) * 0.5;
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

  vec4 image = texture2D(texture, uv);

  gl_FragColor = image;

  float base = 0.5;

  vec2 noiseBlock = vec2(uv.x*4.0, uv.y*0.005);
  float noise = (base - sRandom(noiseBlock + rando)) * 0.2;
  noise += (base - sRandom(vec2(uv.x*0.01, uv.y*0.1)+rando)) * 0.15;

  gl_FragColor.r += noise;
  gl_FragColor.g += noise;
  gl_FragColor.b += noise;
}
`;
