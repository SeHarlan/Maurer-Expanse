
let scl, initD, initN, depth;
let baseNum;
let loading = false;
let constellationMode = false;
let animationMode = true;

let points;
let counter;
let counterMax, counterInc;
let rows, cols;
let randHue;

let instructionContainer, instructionWindow, closeButton, instructionTitle, instructionsList,
  baseNumberInput, scaleNumberInput, depthNumberInput,
  horizontalStep, verticalStep, leftButton, rightButton, downButton, upButton,
  animationCheckbox, constellationCheckbox;
let instructionWindowHidden = true;
let instructionsHidden = true;

//TODO
//Create second canvas for hi res printing
//implement touch/mobile interaction (swipe to move, pinch to zoom, double tap for instructions)

function setup() {
  createCanvas(windowWidth, windowHeight);
  colorMode(HSL); 
  resetParams()
  initParams();

  instructionContainer = document.getElementById("instructionContainer");
  instructionTitle = document.getElementById("instructionTitle");
  instructionsList = document.getElementById("instructionsList");
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

  instructionContainer.onclick = (e) => e.stopPropagation();
  instructionContainer.className = "out";

  instructionsList.className = "hidden";

  instructionTitle.onclick = () => {
    
    instructionsHidden = !instructionsHidden;

    if (instructionsHidden) {
      instructionButton.className = ""
      instructionsList.className = "hidden";
    } else {
      instructionButton.className = "open"
      instructionsList.className = "notHidden";
    }
  }
  
  closeButton.onclick = () => {
    instructionContainer.className = "out"
    instructionWindowHidden = true
  }

  baseNumberInput.onchange = e => {
    baseNum = Number(e.target.value)
    dbMakeGrid()
  }
  leftButton.onclick = () => {
    initD -= depth
    horizontalStep.textContent = initD;
    dbMakeGrid()
  }
  rightButton.onclick = () => {
    initD += depth
    horizontalStep.textContent = initD;
    dbMakeGrid()
  }
  downButton.onclick = () => {
    initN += depth
    verticalStep.textContent = initN;
    dbMakeGrid()
  }
  upButton.onclick = () => {
    initN -= depth
    verticalStep.textContent = initN;
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

  animationCheckbox.onchange = e => {
    animationMode = e.target.checked
    dbMakeGrid()
  }

  constellationCheckbox.onchange = e => {
    constellationMode = e.target.checked
    dbMakeGrid()
  }

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
}

function resetParams() {
  scl = 3
  initD = 1;
  initN = 1;
  depth = 0.5
}

function initParams() {
  baseNum = floor(randomGaussian(0, 1000))
  randHue = random(130, 360 + 80) % 360

  counterInc = radians(1)
  counterMax = TWO_PI - radians(1)
  makeGrid()
}

function getRadius() {
  const base = min(height, width)
  const div = scl//min(rows, cols)
  return base / div * 0.35
}

function drawGrid() {
  noFill();
  
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
      // const l = 100//99 - map(p.y, 0, height, 0, 6)
      if (constellationMode) {
        strokeWeight(constrain(5 - scl, 1, 5));
        stroke(randHue, 60, 100)
        point(v1.x, v1.y)
      } else {
        strokeWeight(1);
        stroke(randHue, 60, 100, 0.6)
        line(v1.x, v1.y, v2.x, v2.y)
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
      const d = initD + (index % cols) * depth;
      const n = initN + (floor((index / cols))) * depth;

      const p = createVector(gx, gy);
      p.d = d;
      p.n = n;
      points.push(p)
    }
  }
  background(0, 0, 0);
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

function keyPressed() {
  // If you hit the s key, save an image
  if (key == 's') {
    save("Maurer Expanse.png");
  }

  if (key == 'p') {
    //TODO
    // create larger canvas and save a hi-res version from there
  }

  if (key == "i") {
    if (instructionWindowHidden) {
      instructionContainer.className = "in"
      instructionWindowHidden = false
    } else {
      instructionContainer.className = "out"
      instructionWindowHidden = true
    }
  }
  if (keyCode === ESCAPE) {
    instructionContainer.className = "out"
    instructionWindowHidden = true
  }
  


  if (key == 'r') {
    initParams()
    initUI()
  }
  if (key == 'c') {
    constellationMode = !constellationMode

    constellationCheckbox.checked = constellationMode
    dbMakeGrid()
  }
  if (key == 'a') {
    animationMode = !animationMode

    animationCheckbox.checked = animationMode
    dbMakeGrid()
  }

  if (key == 'q') {
    resetParams()
    initParams()
    initUI()
    dbMakeGrid()
  }


  if (key == "-" || key == "_") {
    scl++
    scaleNumberInput.value = scl;
    dbMakeGrid()
  }
  if (key == "+" || key == "=") {
    if (scl <= 1) return 
    scl--
    scaleNumberInput.value = scl;
    dbMakeGrid()
  }
 
  if (key == "]" || key == "}") {
    depth /= 2;
    depthNumberInput.value = depth
    dbMakeGrid()
  }
  if (key == "[" || key == "{") {
    depth *= 2;
    depthNumberInput.value = depth
    dbMakeGrid()
  }

  if (!instructionWindowHidden) return;
  //No key board commands past here when instruction window open
  if (keyCode === LEFT_ARROW) {
    initD -= depth
    horizontalStep.textContent = initD;
    dbMakeGrid()
  }
  if (keyCode === RIGHT_ARROW) {
    initD += depth
    horizontalStep.textContent = initD;
    dbMakeGrid()
  }
  if (keyCode === DOWN_ARROW) {
    initN += depth
    verticalStep.textContent = initN;
    dbMakeGrid()
  }
  if (keyCode === UP_ARROW) {
    initN -= depth
    verticalStep.textContent = initN;
    dbMakeGrid()
  }
}

function mouseClicked() {
  if (!instructionWindowHidden) return;
  for (let i = 0; i < points.length; i++) {
    const p = points[i]
    const dist = p.dist(createVector(mouseX, mouseY))
    const radius = getRadius()

    if (dist <= radius) {
      initD = p.d;
      initN = p.n;
      dbMakeGrid()
      return
    }
  }
  return false
}

function touchStarted() {
  if (touches.length >= 2) {
    if (instructionWindowHidden) {
      instructionContainer.className = "in"
      instructionWindowHidden = false
    } else {
      instructionContainer.className = "out"
      instructionWindowHidden = true
    }
  }
}