const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

function resizeCanvas() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.floor(window.innerWidth * dpr);
    canvas.height = Math.floor(window.innerHeight * dpr);
    canvas.style.width = `${window.innerWidth}px`;
    canvas.style.height = `${window.innerHeight}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    canvas.viewWidth = window.innerWidth;
    canvas.viewHeight = window.innerHeight;
}

resizeCanvas();
window.addEventListener("resize", resizeCanvas);

// =====================
// CONFIG
// =====================
const WORLD_SIZE = 3000;
const FOOD_COUNT = 600;
const BOT_COUNT = 12;
const MIN_CELL_MASS = 20;
const EJECT_MASS = 12;
const MERGE_DELAY = 9000;

// =====================
// UTILS
// =====================
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const massToRadius = (m) => Math.sqrt(m) * 3.1;

// =====================
// PLAYER
// =====================
let cells = [{
    x: WORLD_SIZE / 2,
    y: WORLD_SIZE / 2,
    mass: 160,
    radius: massToRadius(160),
    vx: 0,
    vy: 0,
    born: 0
}];

let mouse = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
let lastSplit = 0;
let lastFeed = 0;

// =====================
// WORLD
// =====================
let foods = [];
let bots = [];
let pellets = [];

// =====================
// INPUT
// =====================
canvas.addEventListener("mousemove", (e) => {
    const r = canvas.getBoundingClientRect();
    mouse.x = e.clientX - r.left;
    mouse.y = e.clientY - r.top;
});

canvas.addEventListener("touchmove", (e) => {
    const touch = e.touches[0];
    if (!touch) return;
    const r = canvas.getBoundingClientRect();
    mouse.x = touch.clientX - r.left;
    mouse.y = touch.clientY - r.top;
    e.preventDefault();
}, { passive: false });

document.addEventListener("keydown", (e) => {
    if (e.code === "Space" || e.code === "KeyW") e.preventDefault();
    if (e.code === "Space" && !e.repeat) splitCells();
    if (e.code === "KeyW" && !e.repeat) shootMass();
});

// =====================
// ZOOM
// =====================
function getZoom() {
    const largest = Math.max(...cells.map(cell => cell.radius), 1);
    return clamp(Math.min(window.innerWidth, window.innerHeight) / (largest * 11), 0.28, 1.35);
}

function getCamera() {
    const totalMass = cells.reduce((sum, cell) => sum + cell.mass, 0);
    return {
        x: cells.reduce((sum, cell) => sum + cell.x * cell.mass, 0) / totalMass,
        y: cells.reduce((sum, cell) => sum + cell.y * cell.mass, 0) / totalMass
    };
}

function totalMass() {
    return cells.reduce((sum, cell) => sum + cell.mass, 0);
}

function updateCellRadius(cell) {
    cell.radius = massToRadius(cell.mass);
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

        const cell = cells.find(candidate => dist(candidate, f) < candidate.radius + f.radius);
        if (cell) {
            foods.splice(i, 1);
            cell.mass += 2;
            updateCellRadius(cell);
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

        const target = cells.reduce((closest, cell) => dist(cell, b) < dist(closest, b) ? cell : closest, cells[0]);
        let dx = target.x - b.x;
        let dy = target.y - b.y;
        let d = Math.hypot(dx, dy) || 1;

        if (target.mass > b.mass * 1.3 && d < 350) {
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

        const victim = cells.find(cell => b.mass > cell.mass * 1.15 && dist(cell, b) < b.radius - cell.radius * 0.15);
        if (victim) {
            resetPlayer();
            return;
        }

        const eater = cells.find(cell => cell.mass > b.mass * 1.15 && dist(cell, b) < cell.radius - b.radius * 0.15);
        if (eater) {
            eater.mass += b.mass;
            updateCellRadius(eater);
            bots.splice(i, 1);
        }
    }
}

function resetPlayer() {
    cells = [{
        x: WORLD_SIZE / 2,
        y: WORLD_SIZE / 2,
        mass: 160,
        radius: massToRadius(160),
        vx: 0,
        vy: 0,
        born: Date.now()
    }];
}

function splitCells() {
    if (Date.now() - lastSplit < 250 || cells.length >= 16) return;
    const nextCells = [];
    const angle = Math.atan2(mouse.y - canvas.viewHeight / 2, mouse.x - canvas.viewWidth / 2);
    cells.forEach(cell => {
        if (cell.mass < MIN_CELL_MASS * 2) return;
        const splitMass = cell.mass / 2;
        cell.mass = splitMass;
        updateCellRadius(cell);
        nextCells.push({
            x: clamp(cell.x + Math.cos(angle) * cell.radius, cell.radius, WORLD_SIZE - cell.radius),
            y: clamp(cell.y + Math.sin(angle) * cell.radius, cell.radius, WORLD_SIZE - cell.radius),
            mass: splitMass,
            radius: massToRadius(splitMass),
            vx: Math.cos(angle) * 16,
            vy: Math.sin(angle) * 16,
            born: Date.now()
        });
    });
    cells.push(...nextCells);
    lastSplit = Date.now();
}

function mergeCells() {
    for (let i = cells.length - 1; i >= 0; i--) {
        for (let j = i - 1; j >= 0; j--) {
            const a = cells[i];
            const b = cells[j];
            if (Date.now() - a.born < MERGE_DELAY || Date.now() - b.born < MERGE_DELAY) continue;
            if (dist(a, b) < Math.max(a.radius, b.radius) * 0.65) {
                b.mass += a.mass;
                updateCellRadius(b);
                cells.splice(i, 1);
                break;
            }
        }
    }
}

// =====================
// PLAYER MOVE
// =====================
function updatePlayer() {
    cells.forEach(cell => {
        const dx = mouse.x - canvas.viewWidth / 2;
        const dy = mouse.y - canvas.viewHeight / 2;
        const d = Math.hypot(dx, dy);
        const speed = clamp(430 / cell.radius, 45, 220);
        if (d > 8) {
            cell.vx += (dx / d) * speed * 0.08;
            cell.vy += (dy / d) * speed * 0.08;
        }
        cell.vx *= 0.88;
        cell.vy *= 0.88;
        cell.x = clamp(cell.x + cell.vx / 60, cell.radius, WORLD_SIZE - cell.radius);
        cell.y = clamp(cell.y + cell.vy / 60, cell.radius, WORLD_SIZE - cell.radius);
    });
    mergeCells();
}

function shootMass() {
    if (Date.now() - lastFeed < 140 || totalMass() < 80) return;
    const angle = Math.atan2(mouse.y - canvas.viewHeight / 2, mouse.x - canvas.viewWidth / 2);
    cells.forEach(cell => {
        if (cell.mass < 50) return;
        cell.mass -= EJECT_MASS;
        updateCellRadius(cell);
        pellets.push({
            x: cell.x + Math.cos(angle) * cell.radius,
            y: cell.y + Math.sin(angle) * cell.radius,
            vx: Math.cos(angle) * 420,
            vy: Math.sin(angle) * 420,
            radius: 7,
            mass: EJECT_MASS,
            color: "#f4d35e",
            life: Date.now()
        });
    });
    lastFeed = Date.now();
}

// =====================
// PELLETS
// =====================
function updatePellets() {
    for (let i = pellets.length - 1; i >= 0; i--) {
        let p = pellets[i];

        p.x += p.vx / 60;
        p.y += p.vy / 60;
        p.vx *= 0.96;
        p.vy *= 0.96;

        const cell = cells.find(candidate => Date.now() - p.life > 700 && dist(candidate, p) < candidate.radius);
        if (cell) {
            cell.mass += p.mass;
            updateCellRadius(cell);
            pellets.splice(i, 1);
        } else if (Date.now() - p.life > 8000 || p.x < 0 || p.y < 0 || p.x > WORLD_SIZE || p.y > WORLD_SIZE) {
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

    const screenX = canvas.viewWidth / 2 + (o.x - cam.x) * zoom;
    const screenY = canvas.viewHeight / 2 + (o.y - cam.y) * zoom;

    ctx.arc(screenX, screenY, o.radius * zoom, 0, Math.PI * 2);
    ctx.fill();
}

// =====================
// MINI MAP
// =====================
function drawMiniMap() {
    const size = 150;
    const x = canvas.viewWidth - size - 20;
    const y = 20;

    ctx.fillStyle = "rgba(0,0,0,0.5)";
    ctx.fillRect(x, y, size, size);

    ctx.strokeStyle = "white";
    ctx.strokeRect(x, y, size, size);

    ctx.fillStyle = "white";
    ctx.beginPath();
    cells.forEach(cell => {
        ctx.beginPath();
        ctx.arc(x + (cell.x / WORLD_SIZE) * size, y + (cell.y / WORLD_SIZE) * size, 3, 0, Math.PI * 2);
        ctx.fill();
    });
    ctx.fill();
}

// =====================
// UI
// =====================
function drawUI() {
    const w = 200;
    const h = 50;
    const x = canvas.viewWidth - w - 20;
    const y = canvas.viewHeight - h - 20;

    ctx.fillStyle = "rgba(0,0,0,0.65)";
    ctx.fillRect(x, y, w, h);

    ctx.fillStyle = "white";
    ctx.font = "18px Arial";
    ctx.fillText("Masse: " + Math.floor(totalMass()) + "  |  Espace: split  W: feed", x + 12, y + 32);
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
    cells.forEach(cell => draw(cell, "#f7f7f2", cam, zoom));

    updatePlayer();
    updateBots();
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