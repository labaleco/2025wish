let font;
let tSize = 40; // Set text size to 40px for particle text
let tposX = 40;
let pointCount = 0.9; // Between 0 - 1, point count
let dia = 25; // Diameter of interaction (initial size)
let width2 = 20;

let letters = []; // Array to store each typed letter's particle system
let explodingParticles = []; // Array to store exploding particles
let explosions = []; // Array to track explosions per letter

// Fixed margin for text positioning
let marginLeft = 40;
let marginTop = 40;
let marginRight = 40; // Right margin to prevent text from going off-screen
let marginBottom = 40; // Bottom margin for spacing
let cursorX = marginLeft; // Track the X position for each letter
let cursorY = marginTop + 50; // Adjusted to leave space for the text above
let soundEffect, keySound; // Variables for sound effects

function preload() {
  font = loadFont("AvenirNextLTPro-Demi.otf");
  soundEffect = loadSound("firework.mp3"); // Preload explosion sound effect
  keySound = loadSound("pianoA.mp3"); // Preload key press sound effect
}

function setup() {
  createCanvas(windowWidth, windowHeight);

  tposX - width / 2 - tSize * 1.2;
  tposY = height / 2 + tSize / 2.5;
  textFont(font);
}

function draw() {
  // Draw a dark blue gradient background
  drawGradientBackground();

  // Draw normal instruction text at the top with size 20px
  fill(255); // White color for normal text
  textSize(20); // Set the size of the instruction text to 20px
  textAlign(LEFT, TOP);
  text(
    "What are your wishes for 2025? Write them down over here and press enter to send them to the sky!",
    marginLeft,
    marginTop
  );

  // Update and display all letter particle systems
  for (let i = 0; i < letters.length; i++) {
    let letterParticles = letters[i];
    for (let j = 0; j < letterParticles.length; j++) {
      let p = letterParticles[j];
      p.update();
      p.show();
      p.behaviors();
    }
  }

  // Update and display exploding particles if any (individual letter explosions)
  for (let i = 0; i < explosions.length; i++) {
    let explosion = explosions[i];
    if (millis() - explosion.startTime < 3000) {
      // Check if explosion is within 3 seconds
      for (let p of explosion.particles) {
        p.update();
        p.show();
      }
    } else {
      explosions.splice(i, 1); // Remove explosion after 3 seconds
    }
  }
}

// Function to create a dark blue gradient background
function drawGradientBackground() {
  // Create a gradient from dark blue at the top to a deeper blue at the bottom
  for (let i = 0; i <= height; i++) {
    let inter = map(i, 0, height, 0, 1);
    let c = lerpColor(color(20, 20, 60), color(0, 0, 30), inter); // Dark blue shades
    stroke(c);
    line(0, i, width, i);
  }
}

// When a key is typed, create particles for that letter at the current position
function keyTyped() {
  if (key !== "Enter") {
    // Play the key press sound effect for non-enter keys
    if (keySound.isLoaded()) {
      keySound.play();
    }
  }

  if (key === " ") {
    cursorX += tSize / 2; // Move cursor for spaces
  } else if (key !== "Enter" && keyCode !== BACKSPACE) {
    // Ignore Enter and Backspace keys here
    createLetterParticles(key.toUpperCase(), cursorX, cursorY);
    cursorX += tSize * 0.7; // Move cursor to the right for the next letter

    // Check if the text exceeds the right margin, if so, move to the next line
    if (cursorX > width - marginRight) {
      cursorX = marginLeft;
      cursorY += tSize * 1.2; // Move down to the next line with a little more space between lines
    }
  }
}

// Move particles around for three seconds and clear screen on spacebar press
function keyPressed() {
  if (key === " ") {
    cursorX += tSize * 0.7; // Move cursor for spaces
  }

  if (keyCode === BACKSPACE) {
    // Handle Backspace: delete the last letter and its particles
    if (letters.length > 0) {
      let letterParticles = letters[letters.length - 1];
      letters.pop(); // Remove the last letter and its particles
      cursorX -= tSize * 0.7; // Move cursor back to the previous position
    }
  }

  if (key === "Enter") {
    // Trigger explosion of particles for each typed letter when Enter is pressed
    triggerLetterExplosion(cursorX, cursorY);
    letters = []; // Clear the letters after explosion
    cursorX = marginLeft; // Reset cursor position to the left margin
    cursorY = marginTop + 50; // Reset cursor position to the top margin, below the instruction text
  }
}

// Create particles for a given letter at the fixed position
function createLetterParticles(letter, x, y) {
  let bounds = font.textBounds(letter, 0, 0, tSize);
  let tposX = x - bounds.w / 2;
  let tposY = y + bounds.h / 2;

  let points = font.textToPoints(letter, tposX, tposY, tSize, {
    sampleFactor: pointCount,
  });

  let letterParticles = [];
  for (let i = 0; i < points.length; i++) {
    let pt = points[i];
    let textParticle = new Particle(pt.x, pt.y, dia, color("#FFD500")); // Set particle color to #FFD500 (bright yellow)
    letterParticles.push(textParticle);
  }
  letters.push(letterParticles); // Add to the main letters array
}

function Particle(x, y, d, color) {
  this.home = createVector(x, y); // Home position of the particle
  this.pos = this.home.copy();
  this.target = createVector(x, y);
  this.vel = createVector(random(-1, 1), random(-1, 1)); // Initial random movement
  this.acc = createVector();
  this.maxSpeed = 5;
  this.maxforce = 0.5;
  this.dia = d; // The initial diameter (size)
  this.color = color; // Set particle color
  this.isRandomlyMoving = false; // Track if particle is in random movement mode
}

Particle.prototype.startRandomMovement = function () {
  this.isRandomlyMoving = true;
  this.vel = p5.Vector.random2D().mult(10); // Start with a strong random velocity
};

Particle.prototype.behaviors = function () {
  if (!this.isRandomlyMoving) {
    let mouse = createVector(mouseX, mouseY);
    if (this.pos.dist(mouse) < this.dia) {
      let flee = this.flee(mouse);
      this.applyForce(flee);
    } else {
      let arrive = this.arrive(this.home);
      this.applyForce(arrive);
    }
  }
};

Particle.prototype.applyForce = function (f) {
  this.acc.add(f);
};

Particle.prototype.arrive = function (target) {
  let desired = p5.Vector.sub(target, this.pos);
  let d = desired.mag();
  let speed = this.maxSpeed;

  if (d < 100) {
    speed = map(d, 0, 100, 0, this.maxSpeed);
  }
  desired.setMag(speed);
  let steer = p5.Vector.sub(desired, this.vel);
  steer.limit(this.maxforce);
  return steer;
};

Particle.prototype.flee = function (target) {
  let desired = p5.Vector.sub(this.pos, target);
  let d = desired.mag();

  if (d < this.dia) {
    desired.setMag(this.maxSpeed);
    let steer = p5.Vector.sub(desired, this.vel);
    steer.limit(this.maxforce);
    return steer;
  } else {
    return createVector(0, 0);
  }
};

Particle.prototype.update = function () {
  if (this.isRandomlyMoving) {
    this.acc.add(p5.Vector.random2D().mult(0.5));
  }

  this.pos.add(this.vel);
  this.vel.add(this.acc);
  this.acc.mult(0);

  // Make particles bounce off the borders of the canvas
  if (this.pos.x < 0 || this.pos.x > width) {
    this.vel.x *= -1; // Reverse velocity when hitting left or right
  }
  if (this.pos.y < 0 || this.pos.y > height) {
    this.vel.y *= -1; // Reverse velocity when hitting top or bottom
  }
};

Particle.prototype.show = function () {
  stroke(this.color); // Use the color #FFD500 for particles
  strokeWeight(2); // Slightly smaller stroke for better readability
  point(this.pos.x, this.pos.y);
};

// Trigger explosion of particles for each letter when Enter is pressed
function triggerLetterExplosion(x, y) {
  if (soundEffect.isLoaded()) {
    soundEffect.play();
  }

  let explosionParticles = [];
  for (let i = 0; i < 100; i++) {
    let colorRand = color(random(255), random(255), random(255)); // Random color
    let p = new Particle(x, y, dia * 3, colorRand); // Increase diameter by 3 times during explosion
    p.startRandomMovement();
    explosionParticles.push(p);
  }

  explosions.push({
    particles: explosionParticles,
    startTime: millis(),
  });
}
