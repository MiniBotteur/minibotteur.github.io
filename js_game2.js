const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// =====================
// 🛡️ SAFE IMAGE LOADER
// =====================
function loadImg(src) {
  const img = new Image();
  img.loaded = false;

  img.onload = () => {
    img.loaded = true;
  };

  img.onerror = () => {
    console.error("❌ Image introuvable :", src);
  };

  img.src = src;
  return img;
}

// =====================
// 🖼️ SPRITES
// =====================
const sprites = {
  stand: loadImg("persos/debout.png"),
  crouch: loadImg("persos/par_terre.png")
};

// =====================
// 🎮 GAME STATE
// =====================
const game = {
  running: true,
  speed: 6,
  maxSpeed: 18,
  speedIncrease: 0.001,
  score: 0,
  obstacles: [],
  spawnTimer: 0,
  spawnRate: 1400
};

// =====================
// 🧍 PLAYER
// =====================
const player = {
  x: 80,
  y: 0,
  w: 90,
  h: 110,
  vy: 0,
  gravity: 1.5,
  jumpForce: -22,
  jumping: false,
  crouching: false
};

const groundY = () => canvas.height - player.h - 40;
player.y = groundY();

// =====================
// INPUT
// =====================
const keys = {};
document.addEventListener("keydown", e => keys[e.code] = true);
document.addEventListener("keyup", e => keys[e.code] = false);

// =====================
// OBSTACLES
// =====================
class Obstacle {
  constructor(type) {
    this.type = type;

    if (type === "small") {
      this.w = 45;
      this.h = 75;
    } else {
      this.w = 80;
      this.h = 120;
    }

    this.x = canvas.width + 20;
    this.y = canvas.height - this.h - 40;
  }

  update(speed) {
    this.x -= speed;
  }

  draw() {
    ctx.fillStyle = this.type === "small" ? "red" : "orange";
    ctx.fillRect(this.x, this.y, this.w, this.h);
  }
}

// =====================
// COLLISION SAFE
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
  game.speed = 6;
  game.score = 0;
  game.obstacles = [];
  game.spawnTimer = 0;

  player.y = groundY();
  player.vy = 0;
  player.jumping = false;
}

// =====================
// GAME OVER
// =====================
function drawGameOver() {
  ctx.fillStyle = "rgba(0,0,0,0.6)";
  ctx.fillRect(0,0,canvas.width,canvas.height);

  ctx.fillStyle = "white";
  ctx.font = "50px Arial";
  ctx.textAlign = "center";
  ctx.fillText("GAME OVER", canvas.width/2, canvas.height/2);

  ctx.font = "20px Arial";
  ctx.fillText("ESPACE pour recommencer", canvas.width/2, canvas.height/2+40);
}

// =====================
// LOOP
// =====================
let lastTime = 0;

function update(time = 0) {
  const dt = time - lastTime;
  lastTime = time;

  ctx.clearRect(0,0,canvas.width,canvas.height);

  ctx.fillStyle = "#111";
  ctx.fillRect(0, canvas.height-40, canvas.width, 40);

  if (!game.running) {
    drawGameOver();
    requestAnimationFrame(update);
    return;
  }

  // SCORE
  game.score += game.speed * 0.02 * dt;

  if (game.speed < game.maxSpeed) {
    game.speed += game.speedIncrease * dt;
  }

  // PHYSICS
  player.vy += player.gravity;
  player.y += player.vy;

  const ground = groundY();
  if (player.y > ground) {
    player.y = ground;
    player.vy = 0;
    player.jumping = false;
  }

  // INPUT
  if ((keys["Space"] || keys["ArrowUp"]) && !player.jumping) {
    player.vy = player.jumpForce;
    player.jumping = true;
  }

  player.crouching = keys["ArrowDown"] && !player.jumping;

  const h = player.crouching ? 70 : player.h;
  const sprite = player.crouching ? sprites.crouch : sprites.stand;

  // SPAWN
  game.spawnTimer += dt;
  if (game.spawnTimer > game.spawnRate) {
    const type = Math.random() > 0.5 ? "small" : "big";
    game.obstacles.push(new Obstacle(type));
    game.spawnTimer = 0;
  }

  // OBSTACLES
  game.obstacles.forEach((o,i) => {
    o.update(game.speed);
    o.draw();

    const p = {
      x: player.x + 5,
      y: player.y + 5,
      w: player.w - 10,
      h: h - 5
    };

    if (collide(p,o)) game.running = false;

    if (o.x + o.w < 0) game.obstacles.splice(i,1);
  });

  // PLAYER SAFE DRAW
  if (sprite && sprite.complete && sprite.naturalWidth > 0) {
    ctx.drawImage(sprite, player.x, player.y, player.w, h);
  }

  // SCORE UI
  ctx.fillStyle = "rgba(0,0,0,0.4)";
  ctx.fillRect(canvas.width-220,20,200,50);

  ctx.fillStyle = "white";
  ctx.font = "26px Arial";
  ctx.textAlign = "right";
  ctx.fillText(Math.floor(game.score), canvas.width-30,55);

  requestAnimationFrame(update);
}

// RESTART
document.addEventListener("keydown", e => {
  if (e.code === "Space" && !game.running) resetGame();
});

update();