const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// =====================
// CONFIG
// =====================
const WORLD_SIZE = 3000;
const FOOD_COUNT = 600;
const BOT_COUNT = 12;

// =====================
// UTILS
// =====================
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const massToRadius = (m) => Math.sqrt(m);

// =====================
// PLAYER
// =====================
let player = {
    x: WORLD_SIZE / 2,
    y: WORLD_SIZE / 2,
    mass: 160,
    radius: massToRadius(160)
};

let mouse = { x: canvas.width / 2, y: canvas.height / 2 };

let lastAction = 0;
const DASH_COOLDOWN = 180;

// =====================
// WORLD
// =====================
let foods = [];
let bots = [];
let pellets = [];
let clones = []; // ✅ AJOUT IMPORTANT

// =====================
// INPUT
// =====================
canvas.addEventListener("mousemove", (e) => {
    const r = canvas.getBoundingClientRect();
    mouse.x = e.clientX - r.left;
    mouse.y = e.clientY - r.top;
});

document.addEventListener("keydown", (e) => {
    if (e.code === "Space") {
        if (Date.now() - lastAction > DASH_COOLDOWN) {
            dash();
            lastAction = Date.now();
        }
    }
    if (e.code === "KeyW") shootMass();
});

// =====================
// ZOOM
// =====================
function getZoom() {
    const base = 1.2;
    const minZoom = 0.35;
    const scale = Math.sqrt(player.mass) * 0.02;

    return clamp(base - scale, minZoom, base);
}

function getCamera() {
    return {
        x: player.x,
        y: player.y
    };
}

// =====================
// FOOD
// =====================
function spawnFood() {
    foods = [];
    for (let i = 0; i < FOOD_COUNT; i++) {
        foods.push({
            x: Math.random() * WORLD_SIZE,
            y: Math.random() * WORLD_SIZE,
            radius: 7,
            color: `hsl(${Math.random() * 360},90%,60%)`
        });
    }
}

// =====================
// BOTS
// =====================
function spawnBots() {
    bots = [];
    for (let i = 0; i < BOT_COUNT; i++) {
        let mass = 80;
        bots.push({
            x: Math.random() * WORLD_SIZE,
            y: Math.random() * WORLD_SIZE,
            mass,
            radius: massToRadius(mass),
            vx: Math.random() * 2 - 1,
            vy: Math.random() * 2 - 1,
            color: `hsl(${Math.random() * 360},70%,55%)`
        });
    }
}

// =====================
// PLAYER MOVE
// =====================
function updatePlayer() {
    let dx = mouse.x - canvas.width / 2;
    let dy = mouse.y - canvas.height / 2;
    let d = Math.hypot(dx, dy);

    let speed = clamp(6 / Math.sqrt(player.mass), 0.8, 4);

    if (d > 1) {
        player.x += (dx / d) * speed;
        player.y += (dy / d) * speed;
    }

    player.x = clamp(player.x, player.radius, WORLD_SIZE - player.radius);
    player.y = clamp(player.y, player.radius, WORLD_SIZE - player.radius);
}

// =====================
// FOOD
// =====================
function checkFood() {
    for (let i = foods.length - 1; i >= 0; i--) {
        let f = foods[i];

        if (dist(player, f) < player.radius) {
            foods.splice(i, 1);
            player.mass += 2;
            player.radius = massToRadius(player.mass);
        }
    }

    if (foods.length < FOOD_COUNT * 0.6) spawnFood();
}

// =====================
// BOTS
// =====================
function updateBots() {
    for (let i = bots.length - 1; i >= 0; i--) {
        let b = bots[i];

        let dx = player.x - b.x;
        let dy = player.y - b.y;
        let d = Math.hypot(dx, dy) || 1;

        if (player.mass > b.mass * 1.3 && d < 350) {
            b.vx = -dx / d;
            b.vy = -dy / d;
        } else if (Math.random() < 0.01) {
            b.vx = Math.random() * 2 - 1;
            b.vy = Math.random() * 2 - 1;
        }

        b.x += b.vx * 2;
        b.y += b.vy * 2;

        b.x = clamp(b.x, b.radius, WORLD_SIZE - b.radius);
        b.y = clamp(b.y, b.radius, WORLD_SIZE - b.radius);

        for (let j = foods.length - 1; j >= 0; j--) {
            if (dist(b, foods[j]) < b.radius) {
                b.mass += 2;
                b.radius = massToRadius(b.mass);
                foods.splice(j, 1);
            }
        }

        let d2 = dist(player, b);

        if (d2 < player.radius + b.radius) {
            if (player.radius > b.radius * 1.1) {
                player.mass += b.mass;
                player.radius = massToRadius(player.mass);
                bots.splice(i, 1);
            } else {
                player.mass = 160;
                player.radius = massToRadius(player.mass);
                player.x = WORLD_SIZE / 2;
                player.y = WORLD_SIZE / 2;
            }
        }
    }
}

// =====================
// DASH (SPLIT FIXÉ)
// =====================
function dash() {
    if (player.mass < 60) return;

    let angle = Math.atan2(
        mouse.y - canvas.height / 2,
        mouse.x - canvas.width / 2
    );

    let splitMass = player.mass / 2;

    clones.push({
        x: player.x,
        y: player.y,
        mass: splitMass,
        radius: massToRadius(splitMass),
        vx: Math.cos(angle) * 14,
        vy: Math.sin(angle) * 14,
        life: Date.now()
    });

    player.mass = splitMass;
    player.radius = massToRadius(player.mass);
}

// =====================
// CLONES UPDATE
// =====================
function updateClones() {
    for (let i = clones.length - 1; i >= 0; i--) {
        let c = clones[i];

        c.x += c.vx;
        c.y += c.vy;

        c.vx *= 0.92;
        c.vy *= 0.92;

        if (dist(player, c) < player.radius) {
            player.mass += c.mass;
            player.radius = massToRadius(player.mass);
            clones.splice(i, 1);
            continue;
        }

        if (Date.now() - c.life > 12000) {
            clones.splice(i, 1);
        }
    }
}

// =====================
// SHOOT
// =====================
function shootMass() {
    if (player.mass < 40) return;

    let angle = Math.atan2(
        mouse.y - canvas.height / 2,
        mouse.x - canvas.width / 2
    );

    pellets.push({
        x: player.x,
        y: player.y,
        vx: Math.cos(angle) * 10,
        vy: Math.sin(angle) * 10,
        radius: 6,
        color: "white"
    });

    player.mass -= 10;
    player.radius = massToRadius(player.mass);
}

// =====================
// PELLETS
// =====================
function updatePellets() {
    for (let i = pellets.length - 1; i >= 0; i--) {
        let p = pellets[i];

        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0 || p.y < 0 || p.x > WORLD_SIZE || p.y > WORLD_SIZE) {
            pellets.splice(i, 1);
        }
    }
}


function worldToScreen(x, y, cam, zoom) {
    return {
        x: (x - cam.x) * zoom + canvas.width / 2,
        y: (y - cam.y) * zoom + canvas.height / 2
    };
}

// =====================
// DRAW
// =====================
function draw(o, color, cam, zoom) {
    ctx.fillStyle = color;
    ctx.beginPath();

    const screenX = canvas.width / 2 + (o.x - cam.x) * zoom;
    const screenY = canvas.height / 2 + (o.y - cam.y) * zoom;

    ctx.arc(screenX, screenY, o.radius * zoom, 0, Math.PI * 2);
    ctx.fill();
}

// =====================
// MINI MAP
// =====================
function drawMiniMap() {
    const size = 150;
    const x = canvas.width - size - 20;
    const y = 20;

    ctx.fillStyle = "rgba(0,0,0,0.5)";
    ctx.fillRect(x, y, size, size);

    ctx.strokeStyle = "white";
    ctx.strokeRect(x, y, size, size);

    ctx.fillStyle = "white";
    ctx.beginPath();
    ctx.arc(
        x + (player.x / WORLD_SIZE) * size,
        y + (player.y / WORLD_SIZE) * size,
        3,
        0,
        Math.PI * 2
    );
    ctx.fill();
}

// =====================
// UI
// =====================
function drawUI() {
    const w = 200;
    const h = 50;
    const x = canvas.width - w - 20;
    const y = canvas.height - h - 20;

    ctx.fillStyle = "rgba(0,0,0,0.65)";
    ctx.fillRect(x, y, w, h);

    ctx.fillStyle = "white";
    ctx.font = "18px Arial";
    ctx.fillText("Mass: " + Math.floor(player.mass), x + 20, y + 32);
}

// =====================
// LOOP
// =====================
function loop() {
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    let zoom = getZoom();
    let cam = getCamera();

    foods.forEach(f => draw(f, f.color, cam, zoom));
    bots.forEach(b => draw(b, b.color, cam, zoom));
    pellets.forEach(p => draw(p, p.color, cam, zoom));
    clones.forEach(c => draw(c, "white", cam, zoom));
    draw(player, "white", cam, zoom);

    updatePlayer();
    updateBots();
    updateClones();
    updatePellets();
    checkFood();

    drawMiniMap();
    drawUI();

    requestAnimationFrame(loop);
}

// =====================
// START
// =====================
spawnFood();
spawnBots();
loop();