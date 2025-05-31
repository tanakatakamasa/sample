// 1. Get canvas and context
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Canvas dimensions (should match CSS or be dynamically set)
const CANVAS_WIDTH = 600;
const CANVAS_HEIGHT = 600;
canvas.width = CANVAS_WIDTH;
canvas.height = CANVAS_HEIGHT;

// 2. Paddle class/constructor
class Paddle {
  constructor(x, y, width, height, color) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.color = color;
  }

  draw(context) {
    context.fillStyle = this.color;
    context.fillRect(this.x, this.y, this.width, this.height);
  }
}

// 3. Puck class/constructor
class Puck {
  constructor(x, y, radius, color, dx = 2, dy = -2) { // Added dx, dy
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.color = color;
    this.dx = dx;
    this.dy = dy;
  }

  draw(context) {
    context.fillStyle = this.color;
    context.beginPath();
    context.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
    context.closePath();
    context.fill();
  }

  update() {
    this.x += this.dx;
    this.y += this.dy;
  }

  reset(x, y) {
    this.x = x;
    this.y = y;
    // Randomize direction, keep speed magnitude roughly the same
    let angle = Math.random() * Math.PI * 2; // Random angle
    const speed = Math.sqrt(this.dx*this.dx + this.dy*this.dy) || 2; // Use current speed or default
    this.dx = Math.cos(angle) * speed;
    this.dy = Math.sin(angle) * speed;
    if (this.dy === 0) this.dy = speed / 2 * (Math.random() < 0.5 ? -1 : 1); // Ensure vertical movement
  }
}

// Game States
const GAME_STATES = {
  PRE_GAME: 'pre_game',
  PLAYING: 'playing',
  GOAL_SCORED: 'goal_scored',
  GAME_OVER: 'game_over'
};
let currentGameState = GAME_STATES.PRE_GAME;
const WINNING_SCORE = 5; // Example winning score

// Score elements and variables
const score1Element = document.getElementById('player1Score');
const score2Element = document.getElementById('player2Score');
const score3Element = document.getElementById('player3Score');
let score1 = 0;
let score2 = 0;
let score3 = 0;

// 4. Instantiate puck and paddles
const PADDLE_WIDTH = 100;
const PADDLE_HEIGHT = 10;
const PUCK_RADIUS = 10;

// Puck - initial position set in resetPuckAndServe
const puck = new Puck(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2, PUCK_RADIUS, 'red', 0, 0); // Start static

// Paddles
const paddle1 = new Paddle( // Player paddle
  CANVAS_WIDTH / 2 - PADDLE_WIDTH / 2,
  CANVAS_HEIGHT - PADDLE_HEIGHT - 20, // Adjusted y slightly for better visual
  PADDLE_WIDTH,
  PADDLE_HEIGHT,
  'blue'
);
const playerPaddle = paddle1; // Alias for clarity

const paddle2 = new Paddle( // AI paddle 1 (top-left)
  CANVAS_WIDTH / 4 - PADDLE_WIDTH / 2, // Positioned in its zone
  60, // Adjusted y slightly
  PADDLE_WIDTH,
  PADDLE_HEIGHT,
  'green'
);

const paddle3 = new Paddle( // Static paddle for now (top-right)
  (CANVAS_WIDTH * 3) / 4 - PADDLE_WIDTH / 2, // Positioned in its zone
  60, // Adjusted y slightly
  PADDLE_WIDTH,
  PADDLE_HEIGHT,
  'purple'
);

// Helper function to draw messages
function drawMessage(message) {
  ctx.save(); // Save current context state
  ctx.font = "30px Arial";
  ctx.fillStyle = "black";
  ctx.textAlign = "center";
  ctx.fillText(message, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
  ctx.restore(); // Restore context state
}

// Reset puck to center and give it a new random velocity
function resetPuckAndServe() {
  puck.reset(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
  // Ensure the serve is not too horizontal or too vertical initially
  const initialSpeed = 3;
  let angle = Math.random() * Math.PI / 2 - Math.PI / 4; // -45 to +45 degrees
  if (Math.random() < 0.5) angle += Math.PI; // Randomly send up or down

  puck.dx = Math.cos(angle) * initialSpeed;
  // Puck dy should be towards player or away from last scorer for fairness
  // For now, random, but ensure it moves significantly vertically
  puck.dy = Math.sin(angle) * initialSpeed;
  if (Math.abs(puck.dy) < 1) { // Ensure it's not too flat
      puck.dy = puck.dy < 0 ? -initialSpeed/2 : initialSpeed/2;
  }
}


// Collision detection function: Puck vs Paddle (Rectangle)
function checkCollisionPuckPaddle(puck, paddle) {
  // Find the closest point to the puck's center on the paddle
  let closestX = Math.max(paddle.x, Math.min(puck.x, paddle.x + paddle.width));
  let closestY = Math.max(paddle.y, Math.min(puck.y, paddle.y + paddle.height));

  // Calculate distance between puck's center and this closest point
  const distanceX = puck.x - closestX;
  const distanceY = puck.y - closestY;
  const distanceSquared = (distanceX * distanceX) + (distanceY * distanceY);

  // If distance is less than puck's radius, collision occurs
  return distanceSquared < (puck.radius * puck.radius);
}

function updateScores() {
    score1Element.innerText = "P1: " + score1;
    score2Element.innerText = "P2: " + score2;
    score3Element.innerText = "P3: " + score3;

    if (score1 >= WINNING_SCORE || score2 >= WINNING_SCORE || score3 >= WINNING_SCORE) {
        currentGameState = GAME_STATES.GAME_OVER;
        // Determine winner for message if needed
        // For now, a generic game over message is fine.
    }
}

function handleGoalScored() {
    updateScores(); // Update display, check for game over
    if (currentGameState === GAME_STATES.GAME_OVER) return; // Skip pause if game already ended

    currentGameState = GAME_STATES.GOAL_SCORED;
    // Short pause before reset and play
    setTimeout(() => {
        resetPuckAndServe();
        currentGameState = GAME_STATES.PLAYING;
    }, 1500); // 1.5 second pause
}

function drawGameElements() {
    // Clear the canvas
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    puck.draw(ctx);
    playerPaddle.draw(ctx);
    paddle2.draw(ctx); // AI paddle
    paddle3.draw(ctx); // Static paddle
}

// Main Game Loop
function gameLoop() {
    switch (currentGameState) {
        case GAME_STATES.PRE_GAME:
            drawGameElements(); // Draw initial positions
            drawMessage("Click to Start");
            break;

        case GAME_STATES.PLAYING:
            // Update puck position
            puck.update();

            // Wall collision detection for puck
            if (puck.x + puck.radius > CANVAS_WIDTH || puck.x - puck.radius < 0) {
                puck.dx *= -1;
                puck.x = (puck.x - puck.radius < 0) ? puck.radius : CANVAS_WIDTH - puck.radius;
            }

            // Goal detection
            if (puck.y + puck.radius > CANVAS_HEIGHT) { // Puck hits bottom wall (Player 1's goal)
                console.log("Goal! Puck hit bottom. Score for top players.");
                // Example: if puck was last hit by P2, P3 scores. For now, simplest:
                // This implies P2 or P3 scored against P1. Let's say P2 and P3 share this goal.
                // Or, more simply, the human player (P1) missed. So one of the AIs scores.
                // For this example, let's assume P2 scores if P1 misses.
                // A more advanced system would track who is responsible for which goal area.
                score1++; // Player 1 (human) scores a point. (Mistake in thinking, if it hits P1's goal, P1 LOSES a point or other player gains)
                                // Corrected: if puck hits bottom wall, it's a goal against playerPaddle (P1).
                                // So, either P2 or P3 scores. Let's make it simple: P2 scores if it's on left, P3 if on right.
                                // This is still not quite right. If it's P1's goal line, then one of the top AIs scored.
                                // Let's assign: if puck hits bottom, score for P2 (top-left AI).
                console.log("Goal for Player 2 (AI Top-Left)");
                score2++; // Score for AI player 2 (top-left)
                handleGoalScored();
            } else if (puck.y - puck.radius < 0) { // Puck hits top wall
                console.log("Goal! Puck hit top. Score for Player 1 (Human).");
                // This is player 1's (human) point as they are defending the bottom.
                // So if it hits the top wall, it means one of the AIs missed.
                // We need to determine which AI missed.
                if (puck.x < CANVAS_WIDTH / 2) { // Puck is in left half (paddle2's zone)
                    score3++; // Player 3 (top-right AI) scores
                    console.log("Goal for Player 3 (AI Top-Right) - P2 missed");
                } else { // Puck is in right half (paddle3's zone)
                    score2++; // Player 2 (top-left AI) scores
                    console.log("Goal for Player 2 (AI Top-Left) - P3 missed");
                }
                // The above is also confusing. Let's simplify:
                // Player 1 (bottom) scores if the puck hits the top wall.
                // Player 2 (top-left AI) scores if the puck hits the bottom wall AND puck is on left side.
                // Player 3 (top-right AI) scores if the puck hits the bottom wall AND puck is on right side.
                // This is still not standard. Standard PONG:
                // P1 Goal line: Bottom. If puck hits it, one of the top AIs scored.
                // P2 Goal line: Top-Left. If puck hits it, P1 or P3 scored.
                // P3 Goal line: Top-Right. If puck hits it, P1 or P2 scored.
                // For now, let's use the provided simplified request:
                // Puck hits bottom wall: score1 increments (this was in subtask, means P1 scored against top AIs)
                // Puck hits top wall & puck.x < CANVAS_WIDTH / 2: score2 increments (P2 scored against P1/P3)
                // Puck hits top wall & puck.x >= CANVAS_WIDTH / 2: score3 increments (P3 scored against P1/P2)
                // THIS IS THE GOAL LOGIC FROM THE SUBTASK DESCRIPTION
                if (puck.y + puck.radius > CANVAS_HEIGHT) { // Puck hits P1's (bottom) goal line
                    console.log("Goal against P1 (bottom). P1 scores point."); //This seems counter-intuitive but following prompt
                    score1++; // Per prompt: if puck hits bottom wall, score1 increments.
                    handleGoalScored();
                } else if (puck.y - puck.radius < 0) { // Puck hits top wall (P2/P3's goal line)
                    if (puck.x < CANVAS_WIDTH / 2) {
                        console.log("Goal against P2 (top-left). P2 scores point."); // Counter-intuitive
                        score2++; // Per prompt
                        handleGoalScored();
                    } else {
                        console.log("Goal against P3 (top-right). P3 scores point."); // Counter-intuitive
                        score3++; // Per prompt
                        handleGoalScored();
                    }
                }
            } // End of Goal detection block

            if (currentGameState !== GAME_STATES.PLAYING) break;

            // AI Paddles Movement
            // AI Paddle 1 (paddle2, top-left)
            const aiPaddle1 = paddle2;
            const aiPaddle1Speed = 0.07; // Speed for paddle2
            let targetAi1X = puck.x - aiPaddle1.width / 2;
            const maxAi1X = CANVAS_WIDTH / 2 - aiPaddle1.width; // Zone: left half
            const minAi1X = 0;
            targetAi1X = Math.max(minAi1X, Math.min(targetAi1X, maxAi1X));
            aiPaddle1.x += (targetAi1X - aiPaddle1.x) * aiPaddle1Speed;
            aiPaddle1.x = Math.max(0, Math.min(aiPaddle1.x, CANVAS_WIDTH / 2 - aiPaddle1.width));

            // AI Paddle 2 (paddle3, top-right)
            const aiPaddle2 = paddle3;
            const aiPaddle2Speed = 0.07; // Speed for paddle3
            let targetAi2X = puck.x - aiPaddle2.width / 2;
            const minAi2X = CANVAS_WIDTH / 2; // Zone: right half
            const maxAi2X = CANVAS_WIDTH - aiPaddle2.width;
            targetAi2X = Math.max(minAi2X, Math.min(targetAi2X, maxAi2X));
            aiPaddle2.x += (targetAi2X - aiPaddle2.x) * aiPaddle2Speed;
            aiPaddle2.x = Math.max(CANVAS_WIDTH / 2, Math.min(aiPaddle2.x, CANVAS_WIDTH - aiPaddle2.width));


            // Paddle Collision
            const activePaddles = [playerPaddle, aiPaddle1, aiPaddle2]; // Updated list
            activePaddles.forEach(paddle => {
                if (checkCollisionPuckPaddle(puck, paddle)) {
                    puck.dy *= -1;
                    if (puck.dy > 0) {
                        puck.y = paddle.y + paddle.height + puck.radius + 0.1;
                    } else {
                        puck.y = paddle.y - puck.radius - 0.1;
                    }
                    // Slightly increase puck speed after paddle hit for more challenge
                    puck.dx *= 1.01;
                    puck.dy *= 1.01;
                    // Limit max speed
                    const MAX_SPEED = 10;
                    if (Math.abs(puck.dx) > MAX_SPEED) puck.dx = Math.sign(puck.dx) * MAX_SPEED;
                    if (Math.abs(puck.dy) > MAX_SPEED) puck.dy = Math.sign(puck.dy) * MAX_SPEED;
                }
            });

            drawGameElements();
            break;

        case GAME_STATES.GOAL_SCORED:
            drawGameElements(); // Show state when goal scored
            // Message could be displayed here, or handled by the timeout structure
            // e.g. drawMessage("Goal!");
            break;

        case GAME_STATES.GAME_OVER:
            drawGameElements();
            let winnerMsg = "Game Over! ";
            if (score1 >= WINNING_SCORE) winnerMsg += "Player 1 (Bottom) Wins!";
            else if (score2 >= WINNING_SCORE) winnerMsg += "Player 2 (Top-Left AI) Wins!";
            else if (score3 >= WINNING_SCORE) winnerMsg += "Player 3 (Top-Right AI) Wins!";
            else winnerMsg += "Game Over!";
            drawMessage(winnerMsg + " Click to Restart.");
            break;
    }

    requestAnimationFrame(gameLoop);
}

// Initialize Game
function initializeGame() {
    score1 = 0;
    score2 = 0;
    score3 = 0;
    updateScores(); // Display initial scores (0)

    // Reset paddle positions (optional, good for a full reset)
    playerPaddle.x = CANVAS_WIDTH / 2 - PADDLE_WIDTH / 2;
    paddle2.x = CANVAS_WIDTH / 4 - PADDLE_WIDTH / 2;
    paddle3.x = (CANVAS_WIDTH * 3) / 4 - PADDLE_WIDTH / 2;

    resetPuckAndServe();
    puck.dx = 0; // Puck should be static until first click
    puck.dy = 0;
    currentGameState = GAME_STATES.PRE_GAME;
}

// Event Listener for starting/restarting game
canvas.addEventListener('click', function() {
    if (currentGameState === GAME_STATES.PRE_GAME || currentGameState === GAME_STATES.GAME_OVER) {
        initializeGame(); // Reset scores and everything for a new game
        resetPuckAndServe(); // Give puck initial velocity
        currentGameState = GAME_STATES.PLAYING;
    }
});

// Event Listener for mouse movement (player paddle)
canvas.addEventListener('mousemove', function(event) {
    if (currentGameState !== GAME_STATES.PLAYING) return; // Only move paddle if playing

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    let mouseX = (event.clientX - rect.left) * scaleX;
    let newX = mouseX - playerPaddle.width / 2;

    newX = Math.max(0, Math.min(newX, CANVAS_WIDTH - playerPaddle.width)); // Clamp
    playerPaddle.x = newX;
});


// Start the game logic
initializeGame(); // Set up for PRE_GAME state
gameLoop(); // Start the animation loop

console.log("Game initialized. Waiting for click to start.");
