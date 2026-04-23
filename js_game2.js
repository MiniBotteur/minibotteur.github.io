const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// =====================
// 🖼️ SPRITES
// =====================
function loadImg(src) {
  const img = new Image();
  img.src = src;
  return img;
}

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
  baseSpeed: 6,
  maxSpeed: 18,
  speedIncrease: 0.0012,
  score: 0,
  obstacles: [],
  spawnTimer: 0,
  spawnRate: 1400
};

// =====================
// 🧍 PLAYER (sprites)
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
// ⌨ INPUT
// =====================
const keys = {};
document.addEventListener("keydown", e => keys[e.code] = true);
document.addEventListener("keyup", e => keys[e.code] = false);

// =====================
// 🧱 OBSTACLES
// =====================
class Obstacle {
  constructor(type) {
    this.type = type;

    if (type === "small") {
      this.w = 40;
      this.h = 70;
      this.y = canvas.height - this.h - 40;
    } else {
      this.w = 70;
      this.h = 110;
      this.y = canvas.height - this.h - 40;
    }

    this.x = canvas.width + 20;
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
// 💥 COLLISION (propre & jouable)
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
// 🔄 RESET
// =====================
function resetGame() {
  game.running = true;
  game.speed = game.baseSpeed;
  game.score = 0;
  game.obstacles = [];
  game.spawnTimer = 0;

  player.y = groundY();
  player.vy = 0;
  player.jumping = false;
}

// =====================
// 💀 GAME OVER
// =====================
function drawGameOver() {
  ctx.fillStyle = "rgba(0,0,0,0.6)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "white";
  ctx.font = "50px Arial";
  ctx.textAlign = "center";
  ctx.fillText("GAME OVER", canvas.width / 2, canvas.height / 2);

  ctx.font = "20px Arial";
  ctx.fillText(
    "Appuie sur ESPACE pour recommencer",
    canvas.width / 2,
    canvas.height / 2 + 40
  );
}

// =====================
// 🧠 LOOP
// =====================
let lastTime = 0;

function update(time = 0) {
  const dt = time - lastTime;
  lastTime = time;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // sol
  ctx.fillStyle = "#111";
  ctx.fillRect(0, canvas.height - 40, canvas.width, 40);

  if (!game.running) {
    drawGameOver();
    requestAnimationFrame(update);
    return;
  }

  // =====================
  // 📈 SCORE + SPEED
  // =====================
  game.score += game.speed * 0.02 * dt;

  if (game.speed < game.maxSpeed) {
    game.speed += game.speedIncrease * dt;
  }

  // =====================
  // 🦖 PHYSICS
  // =====================
  player.vy += player.gravity;
  player.y += player.vy;

  const ground = groundY();
  if (player.y > ground) {
    player.y = ground;
    player.vy = 0;
    player.jumping = false;
  }

  // =====================
  // 🎮 INPUT
  // =====================
  if ((keys["Space"] || keys["ArrowUp"]) && !player.jumping) {
    player.vy = player.jumpForce;
    player.jumping = true;
  }

  player.crouching = keys["ArrowDown"] && !player.jumping;

  const currentH = player.crouching ? 70 : player.h;
  const sprite = player.crouching ? sprites.crouch : sprites.stand;

  // =====================
  // 🧱 SPAWN OBSTACLES
  // =====================
  game.spawnTimer += dt;

  if (game.spawnTimer > game.spawnRate) {
    const type = Math.random() > 0.5 ? "small" : "big";
    game.obstacles.push(new Obstacle(type));
    game.spawnTimer = 0;
  }

  // =====================
  // 🧱 UPDATE OBSTACLES
  // =====================
  game.obstacles.forEach((o, i) => {
    o.update(game.speed);
    o.draw();

    const p = {
      x: player.x + 5,
      y: player.y + 5,
      w: player.w - 10,
      h: currentH - 5
    };

    if (collide(p, o)) game.running = false;

    if (o.x + o.w < 0) game.obstacles.splice(i, 1);
  });

  // =====================
  // 🧍 PLAYER DRAW (SPRITE)
  // =====================
  ctx.drawImage(
    sprite,
    player.x,
    player.y,
    player.w,
    currentH
  );

  // =====================
  // 📊 SCORE UI
  // =====================
  ctx.fillStyle = "rgba(0,0,0,0.4)";
  ctx.fillRect(canvas.width - 220, 20, 200, 50);

  ctx.fillStyle = "white";
  ctx.font = "26px Arial";
  ctx.textAlign = "right";
  ctx.fillText(
    `Score: ${Math.floor(game.score)}`,
    canvas.width - 30,
    55
  );

  requestAnimationFrame(update);
}

// =====================
// 🔁 RESTART
// =====================
document.addEventListener("keydown", e => {
  if (e.code === "Space" && !game.running) {
    resetGame();
  }
});

update();