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
// 🎮 GAME STATE (START PLUS LENT)
// =====================
const game = {
  running: true,
  speed: 3.2,        // 🔥 PLUS LENT AU DÉPART (important)
  maxSpeed: 18,
  speedIncrease: 0.0009,
  score: 0,
  finalScore: 0,
  obstacles: [],
  spawnTimer: 0,
  spawnRate: 1500
};

// =====================
// 🧍 PLAYER (SAUT PLUS LONG)
// =====================
const player = {
  x: 80,
  y: 0,
  w: 90,
  h: 110,

  vy: 0,

  // 🔥 GRAVITÉ PLUS FAIBLE = SAUT PLUS LONG
  gravity: 1.05,

  // 🔥 légèrement ajusté pour garder hauteur correcte
  jumpForce: -27,

  jumping: false,
  crouching: false
};

const ground = () => canvas.height - 40;

// =====================
// INPUT
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
    this.x = canvas.width + 20;

    if (type === "ground") {
      this.w = 50;
      this.h = 80;
      this.y = ground() - this.h;
      this.color = "red";
    }

    if (type === "head") {
      this.w = 70;
      this.h = 40;
      this.y = ground() - player.h - 20;
      this.color = "orange";
    }
  }

  update(speed) {
    this.x -= speed;
  }

  draw() {
    ctx.fillStyle = this.color;
    ctx.fillRect(this.x, this.y, this.w, this.h);
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
  game.obstacles = [];
  game.spawnTimer = 0;

  player.y = ground() - player.h;
  player.vy = 0;
  player.jumping = false;
}

// =====================
// GAME OVER
// =====================
function drawGameOver() {
  ctx.fillStyle = "rgba(0,0,0,0.7)";
  ctx.fillRect(0,0,canvas.width,canvas.height);

  ctx.fillStyle = "white";
  ctx.textAlign = "center";

  ctx.font = "60px Arial";
  ctx.fillText("GAME OVER", canvas.width/2, canvas.height/2 - 60);

  ctx.font = "30px Arial";
  ctx.fillText(
    "Score : " + Math.floor(game.finalScore),
    canvas.width/2,
    canvas.height/2
  );

  ctx.font = "20px Arial";
  ctx.fillText(
    "Appuie sur ESPACE pour recommencer",
    canvas.width/2,
    canvas.height/2 + 50
  );
}

// =====================
// LOOP
// =====================
let lastTime = 0;

function update(time = 0) {
  const dt = time - lastTime;
  lastTime = time;

  ctx.clearRect(0,0,canvas.width,canvas.height);

  // sol
  ctx.fillStyle = "#111";
  ctx.fillRect(0, ground(), canvas.width, 40);

  if (!game.running) {
    drawGameOver();
    requestAnimationFrame(update);
    return;
  }

  // =====================
  // SCORE + SPEED
  // =====================
  game.score += game.speed * 0.02 * dt;

  if (game.speed < game.maxSpeed) {
    game.speed += game.speedIncrease * dt;
  }

  // =====================
  // 🦘 PHYSICS (SAUT LONG)
  // =====================
  player.vy += player.gravity;
  player.y += player.vy;

  const g = ground() - player.h;

  if (player.y > g) {
    player.y = g;
    player.vy = 0;
    player.jumping = false;
  }

  // =====================
  // INPUT
  // =====================
  const wantsJump = (keys["Space"] || keys["ArrowUp"]);
  const wantsCrouch = keys["ArrowDown"];

  if (wantsJump && !player.jumping) {
    player.vy = player.jumpForce;
    player.jumping = true;
  }

  player.crouching = wantsCrouch && !player.jumping;

  const crouchHeight = 70;
  const h = player.crouching ? crouchHeight : player.h;

  const sprite = player.crouching ? sprites.crouch : sprites.stand;

  if (!player.jumping) {
    player.y = ground() - h;
  }

  // =====================
  // SPAWN
  // =====================
  game.spawnTimer += dt;

  if (game.spawnTimer > game.spawnRate) {
    const type = Math.random() > 0.5 ? "ground" : "head";
    game.obstacles.push(new Obstacle(type));
    game.spawnTimer = 0;
  }

  // =====================
  // OBSTACLES
  // =====================
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

  // =====================
  // PLAYER DRAW
  // =====================
  if (sprite && sprite.complete && sprite.naturalWidth > 0) {
    ctx.drawImage(sprite, player.x, player.y, player.w, h);
  } else {
    ctx.fillStyle = "lime";
    ctx.fillRect(player.x, player.y, player.w, h);
  }

  // =====================
  // SCORE UI
  // =====================
  ctx.fillStyle = "rgba(0,0,0,0.4)";
  ctx.fillRect(canvas.width-220,20,200,50);

  ctx.fillStyle = "white";
  ctx.font = "26px Arial";
  ctx.textAlign = "right";
  ctx.fillText(Math.floor(game.score), canvas.width-30,55);

  requestAnimationFrame(update);
}

// =====================
// RESTART
// =====================
document.addEventListener("keydown", e => {
  if (e.code === "Space" && !game.running) resetGame();
});

update();