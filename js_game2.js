const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const startBtn = document.getElementById("startBtn");
const menuBtn = document.getElementById("menuBtn");

let gameStarted = false;

startBtn.onclick = () => {
  // 🔥 Supprime le fond d’avant-jeu
  document.body.classList.add("playing");

  startBtn.style.display = "none";
  gameStarted = true;
  update();
};

menuBtn.onclick = () => {
  window.location.href = "index.html";
};

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

function loadImage(src) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

const assets = {};

const game = {
  running: true,
  speed: 3,
  score: 0,
  finalScore: 0,
  obstacles: [],
  spawnTimer: 0,
  spawnRate: 1400
};

const ground = () => canvas.height - 40;

let bgX = 0;
let cloudsX = 0;

// =====================
// PLAYER
// =====================
const player = {
  x: 80,
  y: 0,
  w: 120,
  h: 170,
  vy: 0,

  baseGravity: 0.5,
  baseJump: -24,

  gravity: 0.5,
  jumpForce: -24,

  jumping: false,
  crouching: false,

  crouchFrame: 0,
  crouchTimer: 0,
  crouchSpeed: 120,

  drawOffsetX: 0
};

// =====================
// INPUT
// =====================
const keys = {};
let jumpKeyHeld = false;

addEventListener("keydown", (e) => {
  keys[e.code] = true;

  if ((e.code === "Space" || e.code === "ArrowUp") && game.running) {
    if (!jumpKeyHeld && !player.jumping) {
      player.vy = player.jumpForce;
      player.jumping = true;
    }
    jumpKeyHeld = true;
  }

  if (!game.running && e.code === "Space") resetGame();
});

addEventListener("keyup", (e) => {
  keys[e.code] = false;

  if (e.code === "Space" || e.code === "ArrowUp") {
    jumpKeyHeld = false;
  }
});

// =====================
// OBSTACLES
// =====================
class Obstacle {
  constructor(type) {
    this.type = type;
    this.x = canvas.width + 20;

    const groundType = type === "ground";

    this.w = groundType ? 100 : 130;
    this.h = groundType ? 75 : 70;
    this.y = groundType
      ? ground() - this.h
      : ground() - player.h - 60;

    this.variant = groundType && (Math.random() < 0.5 ? "rock1" : "rock2");
  }

  update(speed) {
    this.x -= speed;
  }

  draw() {
    const img =
      this.type === "ground"
        ? assets[this.variant]
        : assets.airplane;

    ctx.drawImage(img, this.x, this.y, this.w, this.h);
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
  game.speed = 3;
  game.score = 0;
  game.finalScore = 0;
  game.obstacles = [];
  game.spawnTimer = 0;

  player.y = ground() - player.h;
  player.vy = 0;
  player.jumping = false;

  player.crouchFrame = 0;
  player.crouchTimer = 0;
  player.drawOffsetX = 0;

  jumpKeyHeld = false;

  menuBtn.style.display = "none";
}

// =====================
// SPEED
// =====================
function updateSpeed(dt) {
  if (game.score < 5000) {
    game.speed = 3 + (game.score / 5000) * 1.5;
  } else if (game.score < 15000) {
    game.speed = 4.5 + ((game.score - 5000) / 10000) * 3;
  } else {
    game.speed = Math.min(8, game.speed + 0.002 * dt);
  }

  game.spawnRate = 1400 - Math.min(600, game.speed * 80);
}



// =====================
// JUMP PHYSICS
// =====================
function updateJumpPhysics() {
  const t = Math.min(1, (game.speed - 3) / 5);

  // 🔥 Gravité encore un peu plus faible = saut plus long
  player.gravity = player.baseGravity + t * 0.32;

  // 🔥 Jump légèrement plus fort = un tout petit peu plus haut
  player.jumpForce = player.baseJump + 4 - t * 2;
}





let lastTime = 0;

// =====================
// LOOP
// =====================
function update(time = 0) {
  const dt = time - lastTime;
  lastTime = time;

  if (!gameStarted) return requestAnimationFrame(update);

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // BACKGROUND
  if (assets.background) {
    if (game.running) {
      bgX -= game.speed;
      if (bgX <= -canvas.width) bgX = 0;
    }

    ctx.globalAlpha = 0.6;
    ctx.drawImage(assets.background, bgX, 0, canvas.width, canvas.height);
    ctx.drawImage(assets.background, bgX + canvas.width, 0, canvas.width, canvas.height);
    ctx.globalAlpha = 1;
  }

  // CLOUDS
  if (assets.clouds) {
    if (game.running) {
      cloudsX -= game.speed * 0.3;
      if (cloudsX <= -canvas.width) cloudsX = 0;
    }

    ctx.globalAlpha = 0.95;
    const cloudHeight = canvas.height / 5.5;

    ctx.drawImage(assets.clouds, cloudsX, 0, canvas.width, cloudHeight);
    ctx.drawImage(assets.clouds, cloudsX + canvas.width, 0, canvas.width, cloudHeight);

    ctx.globalAlpha = 1;
  }

  // GAME OVER
  if (!game.running) {
    menuBtn.style.display = "block";

    game.obstacles.forEach(o => o.draw());

    const h = player.crouching ? 95 : player.h;
    const sprite = player.crouching ? assets.crouch : assets.stand;

    ctx.drawImage(sprite, player.x + player.drawOffsetX, player.y, player.w, h);

    ctx.fillStyle = "rgba(0,0,0,0.65)";
    ctx.fillRect(canvas.width/2 - 250, canvas.height/2 - 120, 500, 220);

    ctx.fillStyle = "white";
    ctx.textAlign = "center";
    ctx.font = "55px Arial";
    ctx.fillText("GAME OVER", canvas.width / 2, canvas.height / 2 - 40);

    ctx.font = "28px Arial";
    ctx.fillText("Score : " + Math.floor(game.finalScore),
      canvas.width / 2,
      canvas.height / 2 + 10
    );

    ctx.font = "20px Arial";
    ctx.fillText("Appuie sur ESPACE pour recommencer",
      canvas.width / 2,
      canvas.height / 2 + 55
    );

    return requestAnimationFrame(update);
  }

  // SCORE
  ctx.fillStyle = "rgba(0,0,0,0.55)";
  ctx.fillRect(canvas.width - 160, 10, 150, 45);

  ctx.fillStyle = "white";
  ctx.font = "28px Arial";
  ctx.textAlign = "right";
  ctx.fillText(Math.floor(game.score), canvas.width - 20, 43);

  game.score += 0.02 * dt;

  updateSpeed(dt);
  updateJumpPhysics();

  // PHYSICS
  player.vy += player.gravity;
  player.vy = Math.min(player.vy, 25);
  player.y += player.vy;

  const g = ground() - player.h;

  if (player.y > g) {
    player.y = g;
    player.vy = 0;
    player.jumping = false;
  }

  // CROUCH
  player.crouching = keys.ArrowDown && !player.jumping;

  let sprite;
  const h = player.crouching ? 95 : player.h;

  if (player.crouching) {
    player.crouchTimer += dt * 0.6;

    if (player.crouchTimer > player.crouchSpeed) {
      player.crouchFrame = (player.crouchFrame + 1) % 2;
      player.crouchTimer = 0;
    }

    if (player.crouchFrame === 0) {
      sprite = assets.crouch;
      player.drawOffsetX = 0;
    } else {
      sprite = assets.crouch2;
      player.drawOffsetX = 6;
    }

  } else {
    sprite = assets.stand;
    player.crouchFrame = 0;
    player.crouchTimer = 0;
    player.drawOffsetX = 0;
  }

  if (!player.jumping) {
    player.y = ground() - h;
  }

  // SPAWN
  game.spawnTimer += dt;

  if (game.spawnTimer > game.spawnRate) {
    game.obstacles.push(new Obstacle(Math.random() > 0.5 ? "ground" : "air"));
    game.spawnTimer = 0;
  }

  // COLLISIONS
  const p = {
    x: player.x + 15,
    y: player.y,
    w: player.w - 30,
    h: h
  };

  game.obstacles.forEach((o, i) => {
    o.update(game.speed);
    o.draw();

    let hitbox = o.type === "ground"
      ? { x: o.x + 12, y: o.y + 15, w: o.w - 24, h: o.h - 20 }
      : { x: o.x, y: o.y, w: o.w, h: o.h };

    if (collide(p, hitbox)) {
      game.running = false;
      game.finalScore = game.score;
    }

    if (o.x + o.w < 0) game.obstacles.splice(i, 1);
  });

  ctx.drawImage(sprite, player.x + player.drawOffsetX, player.y, player.w, h);

  requestAnimationFrame(update);
}

// =====================
// INIT
// =====================
async function init() {
  const [stand, crouch, crouch2, rock1, rock2, airplane, background, clouds] =
    await Promise.all([
      loadImage("assets/persos/debout.png"),
      loadImage("assets/persos/par_terre.png"),
      loadImage("assets/persos/par_terre2.png"),
      loadImage("assets/persos/caillou.png"),
      loadImage("assets/persos/caillou2.png"),
      loadImage("assets/persos/avion.png"),
      loadImage("assets/persos/fond.png"),
      loadImage("assets/persos/ciel_nuages.png")
    ]);

  Object.assign(assets, {
    stand,
    crouch,
    crouch2,
    rock1,
    rock2,
    airplane,
    background,
    clouds
  });

  player.y = ground() - player.h;

  update();
}

init();
