const canvas = document.getElementById('canvasMap');
const ctx = canvas.getContext('2d');
canvas.width = 900;
canvas.height = 600;

//global var
const cellSize = 100;
const cellGap = 3;

let numberOfResources = 500;
const enemyPositions = [];
let enemyInterval = 900;
let frame = 0;
let gameOver = false;
let score = 0;
let shooting = false;
let winningScore = 100;

const gameGrid = [];
const defenders = [];
const enemies = [];
const projectiles = [];
const resources = [];
const defenderTypes = [];



// Background
const backgroundImage = new Image();
backgroundImage.src = './assets/Frontyard.png';

const defender1 = new Image();
defender1.src = './assets/Peashooter.png'; // Replace with your actual defender image path
defenderTypes.push(defender1);

//enemy types
const enemyTypes = [];
const enemy1 = new Image();
enemy1.src = './assets/Zombie.png';
enemyTypes.push(enemy1);

// Audio
const backgroundMusic = new Audio('./assets/Loonboon.mp3');
backgroundMusic.loop = true; // Makes the music loop continuously

const enemyHitSound = new Audio('./assets/Splat.mp3');

function startBackgroundMusic() {
    backgroundMusic.play();
}

const gameOverSound = new Audio('./assets/lose.mp3');
let gameOverSoundPlayed = false;

//Collision event
function collision(first, second) {
    if (!(first.x > second.x + second.width ||
        first.x + first.width < second.x ||
        first.y > second.y + second.height ||
        first.y + first.height < second.y)) {
        return true;
    }
}

//mouse object
const mouse = {
    x: 10,
    y: 10,
    width: 0.1,
    height: 0.1,
}

let canvasPosition = canvas.getBoundingClientRect();
canvas.addEventListener('mousemove', (e) => {
    mouse.x = e.x - canvasPosition.left;
    mouse.y = e.y - canvasPosition.top;
});
canvas.addEventListener('mouseleave', () => {
    mouse.y = undefined;
    mouse.x = undefined;
})
//controlBar object
const controlBar = {
    width: canvas.width,
    height: cellSize
}

//cell blueprint
class Cell {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = cellSize;
        this.height = cellSize;
    }

    draw() {
        if (mouse.x && mouse.y && collision(this, mouse)) {
            ctx.strokeStyle = "white";
            ctx.strokeRect(this.x, this.y, this.width, this.height);
        }
    }
}
//Create grid
function createGrid() {
    for (let y = cellSize; y < canvas.height; y += cellSize) {
        for (let x = 0; x < canvas.width; x += cellSize) {
            gameGrid.push(new Cell(x, y, cellSize));
        }
    }
}

createGrid();

function handleGameGrid() {
    for (let i = 0; i < gameGrid.length; i++) {
        gameGrid[i].draw();
    }
}

//projectile class
class Projectile {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 10;
        this.height = 10;
        this.power = 10;
        this.speed = 5;
    }

    update() {
        this.x += this.speed;
    }

    draw() {
        ctx.fillStyle = "#06402B";
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.width, 0, Math.PI * 2);
        ctx.fill();
    }
}

// Add debugging to handleProjectile
function handleProjectile() {
    for (let i = 0; i < projectiles.length; i++) {
        projectiles[i].update();
        projectiles[i].draw();

        // Guard against array bounds
        if (!projectiles[i]) continue;

        for (let j = 0; j < enemies.length; j++) {
            if (enemies[j] && projectiles[i] && collision(projectiles[i], enemies[j])) {
                console.log("Hit enemy: damage", projectiles[i].power);
                enemies[j].health -= projectiles[i].power;
                // Play the hit sound
                enemyHitSound.currentTime = 0; // Reset sound to start
                enemyHitSound.play();

                projectiles.splice(i, 1);
                i--;
                break;
            }
        }

        // Only check bounds if projectile still exists
        if (projectiles[i] && projectiles[i].x > canvas.width - cellSize) {
            projectiles.splice(i, 1);
            i--;
        }
    }
}

//defender class
class Defender {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = cellSize - cellGap * 2;
        this.height = cellSize - cellGap * 2;
        this.shooting = false;
        this.health = 100;
        this.projectiles = [];
        this.timer = 0;
        // Add these sprite properties
        this.defenderType = defenderTypes[0];
        this.frameX = 0;
        this.frameY = 0;
        this.minFrame = 0;
        this.maxFrame = 1; // Adjust based on your sprite sheet
        this.spriteWidth = 256; // Adjust based on your sprite dimensions
        this.spriteHeight = 256; // Adjust based on your sprite dimensions
    }

    draw() {
        // Keep health text
        ctx.fillStyle = 'gold';
        ctx.font = '20px Varela Round';
        ctx.fillText(Math.floor(this.health), this.x + 15, this.y + 30);

        // Draw the image instead of the orange rectangle
        ctx.drawImage(
            this.defenderType,
            0,
            0,
            this.spriteWidth,
            this.spriteHeight,
            this.x,
            this.y,
            this.width,
            this.height
        );
    }

    update() {
        if (this.shooting) {
            this.timer++;
            if (this.timer % 100 === 0) {
                projectiles.push(new Projectile(this.x + (this.width / 3), this.y + (this.height / 3)));
            }
        } else {
            this.timer = 0;
        }

        // Add animation logic
        // if(frame % 10 === 0) {
        //     if(this.frameX < this.maxFrame) {
        //         this.frameX++;
        //     } else {
        //         this.frameX = this.minFrame;
        //     }
        // }
    }
}


//handle defender
function handleDefenders() {
    for (let i = 0; i < defenders.length; i++) {
        // First check for enemies in the same row
        let shootingNow = false;
        for (let j = 0; j < enemies.length; j++) {
            // Check if enemy is in the same row (using a more reliable method)
            // We consider "same row" if the base grid position is the same
            const defenderRow = Math.floor(defenders[i].y / cellSize);
            const enemyRow = Math.floor(enemies[j].y / cellSize);

            if (defenderRow === enemyRow && enemies[j].x > defenders[i].x) {
                shootingNow = true;
                break;
            }
        }
        defenders[i].shooting = shootingNow;

        // Update and draw after setting shooting status
        defenders[i].draw();
        defenders[i].update();

        // Collision handling
        for (let j = 0; j < enemies.length; j++) {
            if (defenders[i] && collision(defenders[i], enemies[j])) {
                enemies[j].movement = 0;
                defenders[i].health -= 0.2;

                if (defenders[i].health <= 0) {
                    defenders.splice(i, 1);
                    i--;
                    enemies[j].movement = enemies[j].speed;
                    break; //exit loop when defender removed
                }
            }
        }
    }
}

//enemy class
class Enemy {
    constructor(verticalPosition) {
        this.x = canvas.width;
        this.y = verticalPosition;
        this.width = cellSize - cellGap * 2;
        this.height = (cellSize - cellGap * 2) * 1.5;
        this.speed = Math.random() * 0.2 + 0.4;
        this.movement = this.speed;
        this.health = 100;
        this.maxHealth = this.health;
        this.enemyType = enemyTypes[0];
    }

    update() {
        this.x -= this.movement;
    }

    draw() {
        const heightDifference = this.height - (cellSize - cellGap * 2);
        const adjustedY = this.y - heightDifference / 2;
        // Draw the enemy image
        ctx.drawImage(
            this.enemyType,
            0,
            0,
            this.enemyType.width,
            this.enemyType.height,
            this.x,
            adjustedY,
            this.width,
            this.height
        );

        // Health text on top
        // ctx.fillStyle = 'black';
        // ctx.font = '30px Varela Round';
        // ctx.fillText(Math.floor(this.health), this.x + 15, this.y + 30);
    }
}

//handle enemy
function handleEnemy() {
    for (let i = 0; i < enemies.length; i++) {
        enemies[i].update();
        enemies[i].draw();
        if (enemies[i].x < 0) {
            if (!gameOver) {
                gameOver = true;
                // Only play the game over sound once
                if (!gameOverSoundPlayed) {
                    // Optionally stop the background music
                    backgroundMusic.pause();
                    // Play game over sound
                    gameOverSound.play();
                    gameOverSoundPlayed = true;
                }
            }
        }
        if (enemies[i].health <= 0) {
            let gainedResource = enemies[i].maxHealth / 10;
            numberOfResources += gainedResource;
            score += gainedResource;
            const findThisIndex = enemyPositions.indexOf(enemies[i].y);
            enemyPositions.splice(findThisIndex, 1);
            enemies.splice(i, 1);
            i--;
        }
    }
    if (frame % enemyInterval === 0 && score < winningScore) {
        let verticalPosition = Math.floor(Math.random() * 5 + 1) * cellSize;
        enemies.push(new Enemy(verticalPosition));
        enemyPositions.push(verticalPosition);
        if (enemyInterval > 120) enemyInterval -= 50;
    }
}

//Floating messages
const floatingMessages = [];

class floatingMessage {
    constructor(value, x, y, size, color) {
        this.value = value;
        this.x = x;
        this.y = y;
        this.size = size;
        this.lifeSpan = 0;
        this.color = color;
        this.opacity = 1;
    }

    update() {
        this.y -= 0.3;
        this.lifeSpan += 1;
        if (this.opacity > 0.01) this.opacity -= 0.01;
    }

    draw() {
        ctx.globalAlpha = this.opacity;
        ctx.fillStyle = this.color;
        ctx.font = this.size + 'px Varela Round'
        ctx.fillText(this.value, this.x, this.y);
        ctx.globalAlpha = 1;
    }
}

function handleFloatingMessages() {
    for (let i = 0; i < floatingMessages.length; i++) {
        floatingMessages[i].update();
        floatingMessages[i].draw();
        if (floatingMessages[i].lifeSpan >= 50) {
            floatingMessages.splice(i, 1)
            i--;
        }
    }
}

//resources
const amounts = [20, 30, 40];
// Add this near the top with other global variables
const resourceImage = new Image();
resourceImage.src = './assets/Sun.png';

// Then modify the Resource class:
class Resource {
    constructor() {
        this.x = Math.random() * (canvas.width - cellSize);
        this.y = (Math.floor(Math.random() * 5) + 1) * cellSize + 25;
        this.width = cellSize * 0.6;
        this.height = cellSize * 0.6;
        this.amount = amounts[Math.floor(Math.random() * amounts.length)];
    }

    draw() {
        // Draw the resource image
        ctx.drawImage(
            resourceImage,
            0,
            0,
            resourceImage.width,
            resourceImage.height,
            this.x,
            this.y,
            this.width,
            this.height
        );

        // Draw the amount text
        // ctx.fillStyle = 'black';
        // ctx.font = '20px Varela Round';
        // ctx.fillText(this.amount, this.x + 25, this.y + 25);
    }
}

function handleResources() {
    if (frame % 500 === 0 && score < winningScore) {
        resources.push(new Resource());
    }
    for (let i = 0; i < resources.length; i++) {
        resources[i].draw();
        if (resources[i] && mouse.x && mouse.y && collision(resources[i], mouse)) {
            numberOfResources += resources[i].amount;
            resources.splice(i, 1);
            i--;
        }
    }
}


//util
function handleGameStatus() {
    ctx.fillStyle = "black";
    ctx.font = '30px Varela Round';
    ctx.fillText('Score: ' + score, 20, 35);
    ctx.fillText('Resources: ' + numberOfResources, 20, 75);

    if (gameOver) {
        ctx.fillStyle = 'red';
        ctx.font = '90px Varela Round';
        ctx.fillText('GAME OVER', 160, 300);
    }

    if (score >= winningScore && enemies.length === 0) {
        ctx.fillStyle = 'black';
        ctx.font = '60px Varela Round';
        ctx.fillText('LEVEL COMPLETE', 160, 300);
        ctx.font = '30px Varela Round';
        ctx.fillText('You win with ' + score + ' points', 164, 340);
    }
}

canvas.addEventListener('click', function () {
    const gridPositionX = mouse.x - (mouse.x % cellSize) + cellGap;
    const gridPositionY = mouse.y - (mouse.y % cellSize) + cellGap;
    //check if user clicks outside of grid
    if (gridPositionY < cellSize) return;
    //check if user place multiple in one square
    for (let i = 0; i < defenders.length; i++) {
        if (defenders[i].x === gridPositionX && defenders[i].y === gridPositionY) return;
    }
    //set defender price
    let defenderCost = 100;
    //check if enough resource
    if (numberOfResources >= defenderCost) {
        defenders.push(new Defender(gridPositionX, gridPositionY));
        numberOfResources -= defenderCost;
    } else {
        floatingMessages.push(new floatingMessage('need more resources', mouse.x, mouse.y, 15, 'blue'));
    }
});

//toggle background music
document.getElementById('musicToggle').addEventListener('click', function () {
    if (backgroundMusic.paused) {
        backgroundMusic.play();
        this.textContent = 'Pause Music';
    } else {
        backgroundMusic.pause();
        this.textContent = 'Play Music';
    }
});
let musicStarted = false;

//recursive animate func
function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // ctx.fillStyle = 'green';
    // ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height);
    if (!musicStarted) {
        startBackgroundMusic();
        musicStarted = true;
    }
    handleGameGrid();
    handleProjectile();
    handleDefenders();
    handleEnemy();
    handleResources();
    handleGameStatus();
    handleFloatingMessages();
    frame++;
    if (!gameOver) requestAnimationFrame(animate);
}

animate();

//Adjust canvas to window size
window.addEventListener('resize', function () {
    canvasPosition = canvas.getBoundingClientRect();
});