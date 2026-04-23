const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// =====================
// IMAGES
// =====================
function loadImage(src) {
  const img = new Image();
  img.src = src;
  return img;
}

const assets = {
  stand: loadImage("persos/debout.png"),
  crouch: loadImage("persos/par_terre.png"),

  // 🔥 2 cailloux
  rock1: loadImage("persos/caillou.png"),
  rock2: loadImage("persos/caillou2.png")
};

// =====================
// GAME STATE
// =====================
const game = {
  running: true,
  speed: 3.2,
  maxSpeed: 18,
  speedIncrease: 0.0009,
  score: 0,
  finalScore: 0,
  obstacles: [],
  spawnTimer: 0,
  spawnRate: 1400
};

const ground = () => canvas.height - 40;

// =====================
// PLAYER
// =====================
const player = {
  x: 80,
  y: 0,
  w: 90,
  h: 110,
  vy: 0,
  gravity: 1.05,
  jumpForce: -27,
  jumping: false,
  crouching: false
};

// =====================
// INPUT
// =====================
const keys = {};
document.addEventListener("keydown", (e) => {
  keys[e.code] = true;

  if (!game.running && e.code === "Space") {
    resetGame();
  }
});

document.addEventListener("keyup", (e) => {
  keys[e.code] = false;
});

// =====================
// OBSTACLES
// =====================
class Obstacle {
  constructor(type) {
    this.type = type;
    this.x = canvas.width + 20;

    if (type === "ground") {
      this.w = 100;
      this.h = 75;
      this.y = ground() - this.h;

      // 🔥 RANDOM CAILLLOU
      this.variant = Math.random() < 0.5 ? "rock1" : "rock2";
    }

    if (type === "head") {
      this.w = 70;
      this.h = 40;
      this.y = ground() - player.h - 20;
    }
  }

  update(speed) {
    this.x -= speed;
  }

  draw() {
    if (this.type === "ground") {

      const img =
        this.variant === "rock1"
          ? assets.rock1
          : assets.rock2;

      if (img && img.complete && img.naturalWidth > 0) {
        ctx.drawImage(img, this.x, this.y, this.w, this.h);
      } else {
        ctx.fillStyle = "red";
        ctx.fillRect(this.x, this.y, this.w, this.h);
      }

    } else {
      ctx.fillStyle = "orange";
      ctx.fillRect(this.x, this.y, this.w, this.h);
    }
  }
}

// =====================
// COLLISION
// =====================
function collide(a, b) {
  return (
    a.x < b.x + b.w &&
    a.x + a.w > b.x &&
    a.y < b.y + b.h &&
    a.y + a.h > b.y
  );
}

// =====================
// RESET
// =====================
function resetGame() {
  game.running = true;
  game.speed = 3.2;
  game.score = 0;
  game.finalScore = 0;
  game.obstacles = [];
  game.spawnTimer = 0;

  player.y = ground() - player.h;
  player.vy = 0;
  player.jumping = false;
}

// =====================
// LOOP
// =====================
let lastTime = 0;

function update(time = 0) {
  const dt = time - lastTime;
  lastTime = time;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // sol
  ctx.fillStyle = "#111";
  ctx.fillRect(0, ground(), canvas.width, 40);

  if (!game.running) {
    ctx.fillStyle = "white";
    ctx.textAlign = "center";
    ctx.font = "50px Arial";
    ctx.fillText("GAME OVER", canvas.width / 2, canvas.height / 2);

    ctx.font = "25px Arial";
    ctx.fillText(
      "Score : " + Math.floor(game.finalScore),
      canvas.width / 2,
      canvas.height / 2 + 40
    );

    ctx.font = "18px Arial";
    ctx.fillText(
      "Appuie sur ESPACE pour recommencer",
      canvas.width / 2,
      canvas.height / 2 + 80
    );

    return requestAnimationFrame(update);
  }

  // SCORE + SPEED
  game.score += game.speed * 0.02 * dt;

  if (game.speed < game.maxSpeed) {
    game.speed += game.speedIncrease * dt;
  }

  // PHYSICS
  player.vy += player.gravity;
  player.y += player.vy;

  const g = ground() - player.h;

  if (player.y > g) {
    player.y = g;
    player.vy = 0;
    player.jumping = false;
  }

  // INPUT
  const jump = keys["Space"] || keys["ArrowUp"];
  const crouch = keys["ArrowDown"];

  if (jump && !player.jumping) {
    player.vy = player.jumpForce;
    player.jumping = true;
  }

  player.crouching = crouch && !player.jumping;

  const crouchHeight = 70;
  const h = player.crouching ? crouchHeight : player.h;

  const sprite = player.crouching ? assets.crouch : assets.stand;

  if (!player.jumping) {
    player.y = ground() - h;
  }

  // SPAWN
  game.spawnTimer += dt;

  if (game.spawnTimer > game.spawnRate) {
    const type = Math.random() > 0.5 ? "ground" : "head";
    game.obstacles.push(new Obstacle(type));
    game.spawnTimer = 0;
  }

  // OBSTACLES
  game.obstacles.forEach((o, i) => {
    o.update(game.speed);
    o.draw();

    const p = {
      x: player.x,
      y: player.y,
      w: player.w,
      h: h
    };

    if (collide(p, o)) {
      game.running = false;
      game.finalScore = game.score;
    }

    if (o.x + o.w < 0) game.obstacles.splice(i, 1);
  });

  // PLAYER
  if (sprite && sprite.complete && sprite.naturalWidth > 0) {
    ctx.drawImage(sprite, player.x, player.y, player.w, h);
  } else {
    ctx.fillStyle = "lime";
    ctx.fillRect(player.x, player.y, player.w, h);
  }

  // SCORE UI
  ctx.fillStyle = "rgba(0,0,0,0.4)";
  ctx.fillRect(canvas.width - 220, 20, 200, 50);

  ctx.fillStyle = "white";
  ctx.font = "26px Arial";
  ctx.textAlign = "right";
  ctx.fillText(Math.floor(game.score), canvas.width - 30, 55);

  requestAnimationFrame(update);
}

// START
update();