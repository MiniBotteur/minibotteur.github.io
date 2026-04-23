const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let clones = [];
let pellets = [];

// =========================
//     CONFIGURATION
// =========================
const WORLD_SIZE = 3000;
const FOOD_COUNT = 300;
const BOT_COUNT = 10;

// =========================
//     JOUEUR
// =========================
let player = {
    x: WORLD_SIZE / 2,
    y: WORLD_SIZE / 2,
    radius: 100,
    speed: 2,
    mass: 100
};

let mouse = { x: canvas.width / 2, y: canvas.height / 2 };

// =========================
//     INPUT
// =========================
canvas.addEventListener("mousemove", (e) => {
    const rect = canvas.getBoundingClientRect();
    mouse.x = e.clientX - rect.left;
    mouse.y = e.clientY - rect.top;
});

document.addEventListener("keydown", (e) => {
    if (e.code === "Space") splitPlayer();
    if (e.code === "KeyW") shootMass();
});

// =========================
 //     ZOOM DYNAMIQUE
// =========================
function getZoom() {
    // plus tu grossis → plus on dézoome
    const base = 1.2;
    const factor = Math.log10(player.mass + 10) / 3;
    return Math.max(0.4, base - factor);
}

// =========================
//     NOURRITURE
// =========================
let foods = [];

function spawnFood() {
    foods = [];
    for (let i = 0; i < FOOD_COUNT; i++) {
        foods.push({
            x: Math.random() * WORLD_SIZE,
            y: Math.random() * WORLD_SIZE,
            radius: 4,
            color: `hsl(${Math.random() * 360}, 80%, 60%)`
        });
    }
}

// =========================
//     BOTS
// =========================
let bots = [];

function spawnBots() {
    bots = [];
    for (let i = 0; i < BOT_COUNT; i++) {
        bots.push({
            x: Math.random() * WORLD_SIZE,
            y: Math.random() * WORLD_SIZE,
            radius: 30,
            mass: 30,
            speed: 1.5,
            dirX: Math.random() * 2 - 1,
            dirY: Math.random() * 2 - 1,
            color: `hsl(${Math.random() * 360}, 70%, 50%)`
        });
    }
}

// =========================
//     MISE À JOUR JOUEUR
// =========================
function updatePlayer() {
    let dx = mouse.x - canvas.width / 2;
    let dy = mouse.y - canvas.height / 2;
    let dist = Math.hypot(dx, dy);

    player.speed = Math.max(0.8, 6 / Math.sqrt(player.mass));

    if (dist > 1) {
        player.x += (dx / dist) * player.speed;
        player.y += (dy / dist) * player.speed;
    }

    player.x = Math.max(player.radius, Math.min(WORLD_SIZE - player.radius, player.x));
    player.y = Math.max(player.radius, Math.min(WORLD_SIZE - player.radius, player.y));
}

// =========================
//     COLLISIONS NOURRITURE
// =========================
function checkFoodCollisions() {
    for (let i = foods.length - 1; i >= 0; i--) {
        const f = foods[i];
        const dx = f.x - player.x;
        const dy = f.y - player.y;
        const dist = Math.hypot(dx, dy);

        if (dist < player.radius + f.radius) {
            foods.splice(i, 1);
            player.mass += 2;
            player.radius = Math.sqrt(player.mass);
        }
    }

    if (foods.length < FOOD_COUNT / 2) spawnFood();
}

// =========================
//     MISE À JOUR BOTS
// =========================
function updateBots() {
    for (let b of bots) {

        b.speed = Math.max(0.8, 6 / Math.sqrt(b.mass));

        b.x += b.dirX * b.speed;
        b.y += b.dirY * b.speed;

        if (b.x < b.radius || b.x > WORLD_SIZE - b.radius) b.dirX *= -1;
        if (b.y < b.radius || b.y > WORLD_SIZE - b.radius) b.dirY *= -1;

        if (Math.random() < 0.01) {
            b.dirX = Math.random() * 2 - 1;
            b.dirY = Math.random() * 2 - 1;
        }

        for (let i = foods.length - 1; i >= 0; i--) {
            const f = foods[i];
            const dx = f.x - b.x;
            const dy = f.y - b.y;
            const dist = Math.hypot(dx, dy);

            if (dist < b.radius + f.radius) {
                foods.splice(i, 1);
                b.mass += 2;
                b.radius = Math.sqrt(b.mass);
            }
        }

        const dx = b.x - player.x;
        const dy = b.y - player.y;
        const dist = Math.hypot(dx, dy);

        if (dist < player.radius + b.radius && player.radius > b.radius * 1.1) {
            player.mass += b.mass;
            player.radius = Math.sqrt(player.mass);
            bots.splice(bots.indexOf(b), 1);
            continue;
        }

        if (dist < player.radius + b.radius && b.radius > player.radius * 1.1) {
            alert("Tu t'es fait manger !");
            document.location.reload();
        }
    }
}

// =========================
//     SPLIT (ESPACE)
// =========================
function splitPlayer() {
    if (player.mass < 60) return;

    const angle = Math.atan2(mouse.y - canvas.height / 2, mouse.x - canvas.width / 2);

    const cloneMass = player.mass / 2;
    const cloneRadius = Math.sqrt(cloneMass);

    clones.push({
        x: player.x + Math.cos(angle) * player.radius,
        y: player.y + Math.sin(angle) * player.radius,
        mass: cloneMass,
        radius: cloneRadius,
        speed: 8,
        dirX: Math.cos(angle),
        dirY: Math.sin(angle),
        spawnTime: Date.now(),
        merging: false
    });

    player.mass /= 2;
    player.radius = Math.sqrt(player.mass);
}

// =========================
//     FEED (W)
// =========================
function shootMass() {
    if (player.mass < 40) return;

    const angle = Math.atan2(mouse.y - canvas.height / 2, mouse.x - canvas.width / 2);

    pellets.push({
        x: player.x,
        y: player.y,
        radius: 6,
        speed: 10,
        dirX: Math.cos(angle),
        dirY: Math.sin(angle),
        color: "white"
    });

    player.mass -= 10;
    player.radius = Math.sqrt(player.mass);
}

// =========================
//     UPDATE CLONES (fusion auto)
// =========================
function updateClones() {
    const now = Date.now();
    for (let i = clones.length - 1; i >= 0; i--) {
        const c = clones[i];

        if (!c.merging && now - c.spawnTime > 12000) {
            c.merging = true;
        }

        if (c.merging) {
            let dx = player.x - c.x;
            let dy = player.y - c.y;
            let dist = Math.hypot(dx, dy);
            if (dist > 1) {
                c.x += (dx / dist) * c.speed;
                c.y += (dy / dist) * c.speed;
            }

            if (dist < player.radius) {
                player.mass += c.mass;
                player.radius = Math.sqrt(player.mass);
                clones.splice(i, 1);
                continue;
            }
        } else {
            c.x += c.dirX * c.speed;
            c.y += c.dirY * c.speed;
            c.speed *= 0.95;
            if (c.speed < 1) c.speed = 1;
        }

        c.x = Math.max(c.radius, Math.min(WORLD_SIZE - c.radius, c.x));
        c.y = Math.max(c.radius, Math.min(WORLD_SIZE - c.radius, c.y));
    }
}

// =========================
//     UPDATE PELLETS
// =========================
function updatePellets() {
    for (let p of pellets) {
        p.x += p.dirX * p.speed;
        p.y += p.dirY * p.speed;
    }
}

// =========================
//     DESSIN CLONES + PELLETS
// =========================
function drawClones(camera) {
    for (let c of clones) {
        const screenX = c.x - camera.x;
        const screenY = c.y - camera.y;

        ctx.fillStyle = "white";
        ctx.beginPath();
        ctx.arc(screenX, screenY, c.radius, 0, Math.PI * 2);
        ctx.fill();
    }
}

function drawPellets(camera) {
    for (let p of pellets) {
        const screenX = p.x - camera.x;
        const screenY = p.y - camera.y;

        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(screenX, screenY, p.radius, 0, Math.PI * 2);
        ctx.fill();
    }
}

// =========================
//     DESSIN NOURRITURE + BOTS + JOUEUR
// =========================
function drawFood(camera) {
    for (const f of foods) {
        const screenX = f.x - camera.x;
        const screenY = f.y - camera.y;

        ctx.fillStyle = f.color;
        ctx.beginPath();
        ctx.arc(screenX, screenY, f.radius, 0, Math.PI * 2);
        ctx.fill();
    }
}
function drawWorldBorder(camera) {
    ctx.strokeStyle = "rgba(255,255,255,0.4)";
    ctx.lineWidth = 10;

    ctx.beginPath();
    ctx.rect(
        -camera.x - WORLD_SIZE / 2 + player.x,
        -camera.y - WORLD_SIZE / 2 + player.y,
        WORLD_SIZE,
        WORLD_SIZE
    );
    ctx.stroke();
}


function drawBots(camera) {
    for (let b of bots) {
        const screenX = b.x - camera.x;
        const screenY = b.y - camera.y;

        ctx.fillStyle = b.color;
        ctx.beginPath();
        ctx.arc(screenX, screenY, b.radius, 0, Math.PI * 2);
        ctx.fill();
    }
}

function drawPlayer() {
    ctx.fillStyle = "white";
    ctx.beginPath();
    ctx.arc(0, 0, player.radius, 0, Math.PI * 2);
    ctx.fill();
}

// =========================
//     GRILLE + MONDE
// =========================
function drawGrid(camera) {
    ctx.strokeStyle = "rgba(255,255,255,0.05)";
    ctx.lineWidth = 1;

    const step = 50;
    const startX = -WORLD_SIZE / 2;
    const endX = WORLD_SIZE / 2;
    const startY = -WORLD_SIZE / 2;
    const endY = WORLD_SIZE / 2;

    for (let x = startX; x <= endX; x += step) {
        ctx.beginPath();
        ctx.moveTo(x - camera.x + player.x, startY - camera.y + player.y);
        ctx.lineTo(x - camera.x + player.x, endY - camera.y + player.y);
        ctx.stroke();
    }

    for (let y = startY; y <= endY; y += step) {
        ctx.beginPath();
        ctx.moveTo(startX - camera.x + player.x, y - camera.y + player.y);
        ctx.lineTo(endX - camera.x + player.x, y - camera.y + player.y);
        ctx.stroke();
    }
}

// =========================
//     MINI-MAP
// =========================
function drawMiniMap() {
    const mapSize = 200;
    const mapX = canvas.width - mapSize - 20;
    const mapY = 20;

    ctx.fillStyle = "rgba(0,0,0,0.4)";
    ctx.fillRect(mapX, mapY, mapSize, mapSize);

    ctx.strokeStyle = "white";
    ctx.lineWidth = 2;
    ctx.strokeRect(mapX, mapY, mapSize, mapSize);

    const px = mapX + (player.x / WORLD_SIZE) * mapSize;
    const py = mapY + (player.y / WORLD_SIZE) * mapSize;

    ctx.fillStyle = "white";
    ctx.beginPath();
    ctx.arc(px, py, 6, 0, Math.PI * 2);
    ctx.fill();

    for (let b of bots) {
        const bx = mapX + (b.x / WORLD_SIZE) * mapSize;
        const by = mapY + (b.y / WORLD_SIZE) * mapSize;

        ctx.fillStyle = b.color;
        ctx.beginPath();
        ctx.arc(bx, by, 4, 0, Math.PI * 2);
        ctx.fill();
    }
}

// =========================
//     SCORE
// =========================
function drawScore() {
    ctx.fillStyle = "white";
    ctx.font = "28px Arial";
    ctx.textAlign = "right";
    ctx.fillText("Masse : " + Math.floor(player.mass), canvas.width - 30, canvas.height - 30);
}

// =========================
//     BOUCLE DE JEU
// =========================
function loop() {
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const zoom = getZoom();

    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.scale(zoom, zoom);

    const camera = {
        x: player.x,
        y: player.y
    };

    drawWorldBorder(camera);
	drawGrid(camera);
    drawFood(camera);
    drawBots(camera);
    drawClones(camera);
    drawPellets(camera);
    drawPlayer();

    ctx.restore();

    drawMiniMap();
    drawScore();

    updatePlayer();
    updateBots();
    updateClones();
    updatePellets();
    checkFoodCollisions();

    requestAnimationFrame(loop);
}

// =========================
//     LANCEMENT
// =========================
spawnFood();
spawnBots();
loop();
