// 获取游戏元素
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const highScoreElement = document.getElementById('high-score');
const startBtn = document.getElementById('start-btn');
const pauseBtn = document.getElementById('pause-btn');
const restartBtn = document.getElementById('restart-btn');

// 游戏配置
const gridSize = 20; // 网格大小
const tileCount = canvas.width / gridSize; // 网格数量

// 游戏速度设置
let gameSpeed = 100; // 默认游戏速度（毫秒）
const speedOptions = {
    slow: 150,    // 慢速
    medium: 100,  // 中速
    fast: 70,     // 快速
    superFast: 50 // 超快速
};

// 游戏状态
let gameRunning = false;
let gamePaused = false;
let gameOver = false;
let score = 0;
let highScore = localStorage.getItem('snakeHighScore') || 0;

// 蛇的初始位置和速度
let snake = [
    { x: 10, y: 10 }
];
let velocityX = 0;
let velocityY = 0;
let lastVelocityX = 0;
let lastVelocityY = 0;

// 食物位置
let food = {
    x: 5,
    y: 5
};

// 游戏循环
let gameInterval;

// 初始化游戏
function initGame() {
    // 显示最高分
    highScoreElement.textContent = highScore;
    
    // 添加事件监听器
    document.addEventListener('keydown', handleKeyPress);
    startBtn.addEventListener('click', startGame);
    pauseBtn.addEventListener('click', togglePause);
    restartBtn.addEventListener('click', restartGame);
    
    // 添加触摸屏支持
    setupTouchControls();
    
    // 设置速度控制
    setupSpeedControl();
    
    // 绘制初始游戏界面
    drawGame();
    
    // 调整画布大小以适应屏幕
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
}

// 开始游戏
function startGame() {
    if (gameOver || !gameRunning) {
        resetGame();
        gameRunning = true;
        gamePaused = false;
        gameInterval = setInterval(gameLoop, gameSpeed);
        startBtn.textContent = '重新开始';
        
        // 游戏开始后禁用速度选择
        const speedSelect = document.getElementById('speed-select');
        if (speedSelect) speedSelect.disabled = true;
    } else {
        restartGame();
    }
}

// 游戏暂停/继续
function togglePause() {
    if (!gameRunning || gameOver) return;
    
    if (gamePaused) {
        // 继续游戏
        gamePaused = false;
        gameInterval = setInterval(gameLoop, gameSpeed);
        pauseBtn.textContent = '暂停';
        
        // 游戏继续后禁用速度选择
        const speedSelect = document.getElementById('speed-select');
        if (speedSelect) speedSelect.disabled = true;
    } else {
        // 暂停游戏
        gamePaused = true;
        clearInterval(gameInterval);
        pauseBtn.textContent = '继续';
        
        // 游戏暂停时启用速度选择
        const speedSelect = document.getElementById('speed-select');
        if (speedSelect) speedSelect.disabled = false;
        
        // 在画布上显示暂停信息
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = 'white';
        ctx.font = '30px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('游戏暂停', canvas.width / 2, canvas.height / 2);
    }
}

// 重新开始游戏
function restartGame() {
    resetGame();
    gameRunning = true;
    gamePaused = false;
    clearInterval(gameInterval);
    gameInterval = setInterval(gameLoop, gameSpeed);
    
    // 游戏重新开始后禁用速度选择
    const speedSelect = document.getElementById('speed-select');
    if (speedSelect) speedSelect.disabled = true;
}

// 重置游戏状态
function resetGame() {
    snake = [{ x: 10, y: 10 }];
    velocityX = 0;
    velocityY = 0;
    lastVelocityX = 0;
    lastVelocityY = 0;
    score = 0;
    scoreElement.textContent = score;
    gameOver = false;
    placeFood();
    
    // 重置游戏后启用速度选择
    const speedSelect = document.getElementById('speed-select');
    if (speedSelect) speedSelect.disabled = false;
}

// 游戏主循环
function gameLoop() {
    if (gameOver || gamePaused) return;
    
    // 更新游戏状态
    moveSnake();
    
    // 检查碰撞
    checkCollision();
    
    if (gameOver) {
        endGame();
        return;
    }
    
    // 检查是否吃到食物（只更新分数，不生成新食物）
    checkFood();
    
    // 绘制游戏
    drawGame();
    
    // 保存当前方向
    lastVelocityX = velocityX;
    lastVelocityY = velocityY;
}

// 移动蛇
function moveSnake() {
    // 创建新的蛇头
    const head = { x: snake[0].x + velocityX, y: snake[0].y + velocityY };
    
    // 将新蛇头添加到蛇身体的前面
    snake.unshift(head);
    
    // 如果吃到食物，生成新的食物，否则移除蛇尾
    if (head.x === food.x && head.y === food.y) {
        placeFood();
    } else {
        snake.pop();
    }
}

// 检查碰撞
function checkCollision() {
    const head = snake[0];
    
    // 检查是否撞墙
    if (head.x < 0 || head.x >= tileCount || head.y < 0 || head.y >= tileCount) {
        gameOver = true;
        return;
    }
    
    // 检查是否撞到自己的身体
    for (let i = 1; i < snake.length; i++) {
        if (head.x === snake[i].x && head.y === snake[i].y) {
            gameOver = true;
            return;
        }
    }
}

// 检查是否吃到食物
function checkFood() {
    const head = snake[0];
    
    if (head.x === food.x && head.y === food.y) {
        // 增加分数
        score++;
        scoreElement.textContent = score;
        
        // 更新最高分
        if (score > highScore) {
            highScore = score;
            highScoreElement.textContent = highScore;
            localStorage.setItem('snakeHighScore', highScore);
        }
    }
}

// 随机放置食物
function placeFood() {
    let validPlacement = false;
    
    while (!validPlacement) {
        food.x = Math.floor(Math.random() * tileCount);
        food.y = Math.floor(Math.random() * tileCount);
        
        // 确保食物不会出现在蛇身上
        validPlacement = true;
        for (let i = 0; i < snake.length; i++) {
            if (food.x === snake[i].x && food.y === snake[i].y) {
                validPlacement = false;
                break;
            }
        }
    }
}

// 处理键盘输入
function handleKeyPress(e) {
    // 如果游戏未开始，按任意键开始
    if (!gameRunning && !gameOver) {
        startGame();
        return;
    }
    
    // 如果游戏暂停，不处理方向键
    if (gamePaused) return;
    
    // 防止反向移动
    switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
            if (lastVelocityY !== 1) { // 不允许向下时向上移动
                velocityX = 0;
                velocityY = -1;
            }
            break;
        case 'ArrowDown':
        case 's':
        case 'S':
            if (lastVelocityY !== -1) { // 不允许向上时向下移动
                velocityX = 0;
                velocityY = 1;
            }
            break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
            if (lastVelocityX !== 1) { // 不允许向右时向左移动
                velocityX = -1;
                velocityY = 0;
            }
            break;
        case 'ArrowRight':
        case 'd':
        case 'D':
            if (lastVelocityX !== -1) { // 不允许向左时向右移动
                velocityX = 1;
                velocityY = 0;
            }
            break;
        case ' ': // 空格键暂停/继续
            togglePause();
            break;
    }
}

// 绘制游戏
function drawGame() {
    // 清除画布
    ctx.fillStyle = '#222';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // 绘制食物 - 苹果
    drawFood(food.x, food.y);
    
    // 绘制蛇
    snake.forEach((segment, index) => {
        if (index === 0) {
            // 绘制蛇头
            drawSnakeHead(segment.x, segment.y);
        } else if (index === snake.length - 1) {
            // 绘制蛇尾
            drawSnakeTail(segment.x, segment.y);
        } else {
            // 绘制蛇身
            ctx.fillStyle = '#27ae60';
            ctx.fillRect(segment.x * gridSize, segment.y * gridSize, gridSize, gridSize);
            
            // 给蛇身添加边框
            ctx.strokeStyle = '#219653';
            ctx.strokeRect(segment.x * gridSize, segment.y * gridSize, gridSize, gridSize);
        }
    });

    
    // 如果游戏结束，显示游戏结束信息
    if (gameOver) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.fillStyle = 'white';
        ctx.font = '30px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('游戏结束!', canvas.width / 2, canvas.height / 2 - 30);
        ctx.fillText(`得分: ${score}`, canvas.width / 2, canvas.height / 2 + 10);
        ctx.font = '20px Arial';
        ctx.fillText('按开始按钮重新开始', canvas.width / 2, canvas.height / 2 + 50);
    }
    
    // 如果游戏未开始且不是游戏结束状态，显示开始提示
    if (!gameRunning && !gameOver) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.fillStyle = 'white';
        ctx.font = '24px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('按开始按钮或任意方向键开始游戏', canvas.width / 2, canvas.height / 2);
    }
}

// 游戏结束
function endGame() {
    clearInterval(gameInterval);
    gameRunning = false;
    drawGame(); // 绘制游戏结束画面
}

// 设置触摸控制
function setupTouchControls() {
    // 触摸开始位置
    let touchStartX = 0;
    let touchStartY = 0;
    
    // 监听触摸开始事件
    canvas.addEventListener('touchstart', function(e) {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
        e.preventDefault();
        
        // 如果游戏未开始，触摸屏幕开始游戏
        if (!gameRunning && !gameOver) {
            startGame();
        }
    }, false);
    
    // 监听触摸结束事件
    canvas.addEventListener('touchend', function(e) {
        if (gamePaused) return;
        
        let touchEndX = e.changedTouches[0].clientX;
        let touchEndY = e.changedTouches[0].clientY;
        
        // 计算水平和垂直方向的移动距离
        let dx = touchEndX - touchStartX;
        let dy = touchEndY - touchStartY;
        
        // 判断移动方向
        if (Math.abs(dx) > Math.abs(dy)) {
            // 水平方向移动更多
            if (dx > 0 && lastVelocityX !== -1) {
                // 向右滑动
                velocityX = 1;
                velocityY = 0;
            } else if (dx < 0 && lastVelocityX !== 1) {
                // 向左滑动
                velocityX = -1;
                velocityY = 0;
            }
        } else {
            // 垂直方向移动更多
            if (dy > 0 && lastVelocityY !== -1) {
                // 向下滑动
                velocityX = 0;
                velocityY = 1;
            } else if (dy < 0 && lastVelocityY !== 1) {
                // 向上滑动
                velocityX = 0;
                velocityY = -1;
            }
        }
        
        e.preventDefault();
    }, false);
    
    // 防止触摸滑动时页面滚动
    canvas.addEventListener('touchmove', function(e) {
        e.preventDefault();
    }, false);
}

// 调整画布大小
function resizeCanvas() {
    // 获取游戏容器的宽度
    const gameContainer = document.querySelector('.game-container');
    const containerWidth = gameContainer.clientWidth;
    
    // 如果是移动设备（小于768px），调整画布大小
    if (window.innerWidth < 768) {
        // 计算新的画布大小，保持正方形
        const newSize = Math.min(containerWidth - 30, 400); // 减去一些边距
        
        // 设置画布大小
        canvas.width = newSize;
        canvas.height = newSize;
        
        // 更新网格大小
        const newGridSize = newSize / tileCount;
        
        // 重新绘制游戏
        drawGame();
    } else {
        // 恢复默认大小
        canvas.width = 400;
        canvas.height = 400;
    }
}

// 设置速度控制
function setupSpeedControl() {
    const speedSelect = document.getElementById('speed-select');
    if (speedSelect) {
        // 设置初始值
        speedSelect.value = 'medium';
        
        // 添加变化事件监听
        speedSelect.addEventListener('change', function() {
            const selectedSpeed = this.value;
            gameSpeed = speedOptions[selectedSpeed];
            
            // 如果游戏正在运行，需要重新设置游戏循环
            if (gameRunning && !gamePaused) {
                clearInterval(gameInterval);
                gameInterval = setInterval(gameLoop, gameSpeed);
            }
            
            // 显示当前速度信息
            updateSpeedInfo(selectedSpeed);
        });
        
        // 初始化显示速度信息
        updateSpeedInfo('medium');
    }
}

// 更新速度信息显示
function updateSpeedInfo(speedLevel) {
    const speedInfo = document.getElementById('speed-info');
    if (speedInfo) {
        let emoji = '';
        switch(speedLevel) {
            case 'slow':
                emoji = '🐢';
                break;
            case 'medium':
                emoji = '🐇';
                break;
            case 'fast':
                emoji = '🐆';
                break;
            case 'superFast':
                emoji = '⚡';
                break;
        }
        speedInfo.textContent = `${emoji}`;
    }
}

// 绘制蛇头
function drawSnakeHead(x, y) {
    const centerX = (x * gridSize) + (gridSize / 2);
    const centerY = (y * gridSize) + (gridSize / 2);
    const radius = gridSize / 2;
    
    // 确定蛇头朝向
    let eyeDirection = {
        dx1: 0, dy1: 0,
        dx2: 0, dy2: 0
    };
    
    if (velocityX === 1) { // 向右
        eyeDirection = { dx1: radius/2, dy1: -radius/3, dx2: radius/2, dy2: radius/3 };
    } else if (velocityX === -1) { // 向左
        eyeDirection = { dx1: -radius/2, dy1: -radius/3, dx2: -radius/2, dy2: radius/3 };
    } else if (velocityY === -1) { // 向上
        eyeDirection = { dx1: -radius/3, dy1: -radius/2, dx2: radius/3, dy2: -radius/2 };
    } else if (velocityY === 1) { // 向下
        eyeDirection = { dx1: -radius/3, dy1: radius/2, dx2: radius/3, dy2: radius/2 };
    } else { // 默认向右
        eyeDirection = { dx1: radius/2, dy1: -radius/3, dx2: radius/2, dy2: radius/3 };
    }
    
    // 绘制蛇头主体
    ctx.fillStyle = '#2ecc71';
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#219653';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // 绘制眼睛
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.arc(centerX + eyeDirection.dx1, centerY + eyeDirection.dy1, radius/4, 0, Math.PI * 2);
    ctx.arc(centerX + eyeDirection.dx2, centerY + eyeDirection.dy2, radius/4, 0, Math.PI * 2);
    ctx.fill();
    
    // 绘制眼球
    ctx.fillStyle = 'black';
    ctx.beginPath();
    ctx.arc(centerX + eyeDirection.dx1, centerY + eyeDirection.dy1, radius/8, 0, Math.PI * 2);
    ctx.arc(centerX + eyeDirection.dx2, centerY + eyeDirection.dy2, radius/8, 0, Math.PI * 2);
    ctx.fill();
}

// 绘制蛇尾
function drawSnakeTail(x, y) {
    const centerX = (x * gridSize) + (gridSize / 2);
    const centerY = (y * gridSize) + (gridSize / 2);
    const radius = gridSize / 2 * 0.8; // 尾巴稍微小一点
    
    // 绘制蛇尾
    ctx.fillStyle = '#27ae60';
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#219653';
    ctx.lineWidth = 2;
    ctx.stroke();
}

// 绘制食物
function drawFood(x, y) {
    const centerX = (x * gridSize) + (gridSize / 2);
    const centerY = (y * gridSize) + (gridSize / 2);
    const radius = gridSize / 2 * 0.8;
    
    // 绘制苹果主体
    ctx.fillStyle = '#e74c3c';
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.fill();
    
    // 绘制苹果高光
    ctx.fillStyle = '#f39c12';
    ctx.beginPath();
    ctx.arc(centerX - radius/3, centerY - radius/3, radius/4, 0, Math.PI * 2);
    ctx.fill();
    
    // 绘制苹果梗
    ctx.strokeStyle = '#8d6e63';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(centerX, centerY - radius);
    ctx.quadraticCurveTo(centerX + radius/4, centerY - radius - radius/2, centerX + radius/2, centerY - radius - radius/4);
    ctx.stroke();
    
    // 绘制苹果叶子
    ctx.fillStyle = '#4CAF50';
    ctx.beginPath();
    ctx.ellipse(centerX + radius/4, centerY - radius - radius/8, radius/3, radius/6, Math.PI/4, 0, Math.PI * 2);
    ctx.fill();
}

// 页面加载完成后初始化游戏
window.onload = initGame;