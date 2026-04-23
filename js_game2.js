// Canvas setup
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// Chargement des sprites
const playerImgStand = new Image();
playerImgStand.src = "persos/debout.png";

const playerImgCrouch = new Image();
playerImgCrouch.src = "persos/par_terre.png";

// Joueur (+15%)
const player = {
    x: 100,
    y: canvas.height - 150,
    width: 150,
    height: 150,
    vy: 0,
    gravity: 1,
    jumpForce: -28, // saut corrigé
    isJumping: false,
    isCrouching: false
};

let score = 0;
let gameOver = false;

// Vitesse progressive
let speed = 3;
let speedIncrease = 0.0005;

// Obstacles (-5% + ajustements)
const obstacleBas = {
    x: canvas.width,
    y: canvas.height - 50, // plus bas
    width: 60,
    height: 60 // plus petit pour passer
};

const obstacleHaut = {
    x: canvas.width + 600,
    y: canvas.height - 150,
    width: 76,
    height: 38
};

let prochainObstacle = "bas";

// Saut
function jump() {
    if (!player.isJumping && !player.isCrouching) {
        player.vy = player.jumpForce;
        player.isJumping = true;
    }
}

// Game Over
function showGameOverMessage() {
    ctx.fillStyle = "rgba(0,0,0,0.5)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "white";
    ctx.font = "70px Arial";
    ctx.textAlign = "center";
    ctx.fillText("GAME OVER", canvas.width / 2, canvas.height / 2 - 40);

    ctx.font = "40px Arial";
    ctx.fillText("Distance : " + Math.floor(score), canvas.width / 2, canvas.height / 2 + 20);

    ctx.font = "25px Arial";
    ctx.fillText("Appuie sur ESPACE pour recommencer", canvas.width / 2, canvas.height / 2 + 80);
}

// Accroupissement
function crouch(active) {
    if (player.isJumping) return;

    if (active) {
        player.isCrouching = true;
        player.height = 65;
    } else {
        player.isCrouching = false;
        player.height = 150;
    }
}

// Boucle du jeu
function update() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "#222";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (gameOver) {
        showGameOverMessage();
        return;
    }

    // Vitesse progressive
    speed += speedIncrease;

    // Score = distance
    score += speed * 0.1;

    // Gravité
    player.vy += player.gravity;
    player.y += player.vy;

    // Sol
    if (player.y >= canvas.height - player.height - 50) {
        player.y = canvas.height - player.height - 50;
        player.vy = 0;
        player.isJumping = false;
    }

    // Déplacement obstacles
    if (prochainObstacle === "bas") {
        obstacleBas.x -= speed;
        if (obstacleBas.x + obstacleBas.width < 0) {
            obstacleBas.x = canvas.width + Math.random() * 400;
            prochainObstacle = "haut";
        }
    }

    if (prochainObstacle === "haut") {
        obstacleHaut.x -= speed;
        if (obstacleHaut.x + obstacleHaut.width < 0) {
            obstacleHaut.x = canvas.width + Math.random() * 400;
            prochainObstacle = "bas";
        }
    }

    // Collision avec hitbox réduite (90%)
    function collide(a, b) {
        const hitA = {
            x: a.x + a.width * 0.05,
            y: a.y + a.height * 0.05,
            width: a.width * 0.9,
            height: a.height * 0.9
        };

        return (
            hitA.x < b.x + b.width &&
            hitA.x + hitA.width > b.x &&
            hitA.y < b.y + b.height &&
            hitA.y + hitA.height > b.y
        );
    }

    if (
        (prochainObstacle === "bas" && collide(player, obstacleBas)) ||
        (prochainObstacle === "haut" && collide(player, obstacleHaut))
    ) {
        gameOver = true;
    }

    // Dessin joueur
    const sprite = player.isCrouching ? playerImgCrouch : playerImgStand;
    ctx.drawImage(sprite, player.x, player.y, player.width, player.height);

    // Dessin obstacles
    if (prochainObstacle === "bas") {
        ctx.fillStyle = "red";
        ctx.fillRect(obstacleBas.x, obstacleBas.y, obstacleBas.width, obstacleBas.height);
    }

    if (prochainObstacle === "haut") {
        ctx.fillStyle = "orange";
        ctx.fillRect(obstacleHaut.x, obstacleHaut.y, obstacleHaut.width, obstacleHaut.height);
    }

    // Score en haut à droite
    ctx.fillStyle = "rgba(0,0,0,0.4)";
    ctx.fillRect(canvas.width - 220, 20, 200, 50);

    ctx.fillStyle = "white";
    ctx.font = "30px Arial";
    ctx.textAlign = "right";
    ctx.fillText("Distance : " + Math.floor(score), canvas.width - 30, 55);

    requestAnimationFrame(update);
}

update();

// Contrôles
document.addEventListener("keydown", (e) => {
    if (e.code === "ArrowUp" || e.code === "Space") jump();
    if (e.code === "ArrowDown") crouch(true);

    if (gameOver && e.code === "Space") location.reload();
});

document.addEventListener("keyup", (e) => {
    if (e.code === "ArrowDown") crouch(false);
});
