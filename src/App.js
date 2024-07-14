import React, { useState, useEffect, useCallback, useRef } from 'react';

const GRID_SIZE = 15;
const CELL_SIZE = 25;
const INITIAL_SNAKE = [{ x: 7, y: 7 }];
const INITIAL_DIRECTION = { x: 1, y: 0 };
const AI_TERMS = ['🧠', '🤖', '📊', '💻', '🔬', '📈', '🗃️', '📡'];
const SNAKE_HEAD = '🐍';

const colors = {
  background: '#2C3E50',
  gridBackground: '#34495E',
  snake: '#2ECC71',
  food: '#E74C3C',
  text: '#ECF0F1'
};

const DIFFICULTY_SETTINGS = {
  easy: { speed: 200, foodFrequency: 0.1 },
  medium: { speed: 150, foodFrequency: 0.07 },
  hard: { speed: 100, foodFrequency: 0.05 }
};

const AISnakeGame = () => {
  const [snake, setSnake] = useState(INITIAL_SNAKE);
  const [direction, setDirection] = useState(INITIAL_DIRECTION);
  const [food, setFood] = useState({ x: 5, y: 5, emoji: AI_TERMS[0] });
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [difficulty, setDifficulty] = useState('medium');
  const [gameSpeed, setGameSpeed] = useState(DIFFICULTY_SETTINGS.medium.speed);

  const eatSound = useRef(new Audio('/sounds/eat-sound.mp3'));
  const gameOverSound = useRef(new Audio('/sounds/game-over-sound.mp3'));
  const turnSound = useRef(new Audio('/sounds/turn-sound.mp3'));

  const playSound = useCallback((sound) => {
    sound.current.currentTime = 0;
    sound.current.play().catch(e => console.error("Error playing sound:", e));
  }, []);

  const generateFood = useCallback(() => {
    if (Math.random() > DIFFICULTY_SETTINGS[difficulty].foodFrequency) return;
    
    const newFood = {
      x: Math.floor(Math.random() * GRID_SIZE),
      y: Math.floor(Math.random() * GRID_SIZE),
      emoji: AI_TERMS[Math.floor(Math.random() * AI_TERMS.length)]
    };
    setFood(newFood);
  }, [difficulty]);

  const moveSnake = useCallback(() => {
    if (gameOver) return;

    const newHead = {
      x: (snake[0].x + direction.x + GRID_SIZE) % GRID_SIZE,
      y: (snake[0].y + direction.y + GRID_SIZE) % GRID_SIZE
    };

    if (snake.some(segment => segment.x === newHead.x && segment.y === newHead.y)) {
      setGameOver(true);
      playSound(gameOverSound);
      return;
    }

    const newSnake = [newHead, ...snake];

    if (newHead.x === food.x && newHead.y === food.y) {
      setScore(prevScore => prevScore + 1);
      playSound(eatSound);
      generateFood();
    } else {
      newSnake.pop();
    }

    setSnake(newSnake);
    generateFood();
  }, [snake, direction, food, gameOver, generateFood, playSound]);

  useEffect(() => {
    const handleKeyPress = (e) => {
      const newDirection = { x: direction.x, y: direction.y };
      switch (e.key) {
        case 'ArrowUp': newDirection.x = 0; newDirection.y = -1; break;
        case 'ArrowDown': newDirection.x = 0; newDirection.y = 1; break;
        case 'ArrowLeft': newDirection.x = -1; newDirection.y = 0; break;
        case 'ArrowRight': newDirection.x = 1; newDirection.y = 0; break;
        default: return;
      }
      if (newDirection.x !== direction.x || newDirection.y !== direction.y) {
        setDirection(newDirection);
        playSound(turnSound);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [direction, playSound]);

  useEffect(() => {
    const gameLoop = setInterval(moveSnake, gameSpeed);
    return () => clearInterval(gameLoop);
  }, [moveSnake, gameSpeed]);

  const resetGame = () => {
    setSnake(INITIAL_SNAKE);
    setDirection(INITIAL_DIRECTION);
    generateFood();
    setGameOver(false);
    setScore(0);
  };

  const changeDifficulty = (newDifficulty) => {
    setDifficulty(newDifficulty);
    setGameSpeed(DIFFICULTY_SETTINGS[newDifficulty].speed);
    resetGame();
  };

  return (
    <div style={{ 
      textAlign: 'center', 
      fontFamily: 'Arial, sans-serif', 
      backgroundColor: colors.background, 
      padding: '20px', 
      borderRadius: '10px',
      color: colors.text 
    }}>
      <h2 style={{ marginBottom: '20px' }}>AI Snake Game</h2>
      <div style={{ marginBottom: '20px' }}>
        <button onClick={() => changeDifficulty('easy')} style={{ marginRight: '10px' }}>Easy</button>
        <button onClick={() => changeDifficulty('medium')} style={{ marginRight: '10px' }}>Medium</button>
        <button onClick={() => changeDifficulty('hard')}>Hard</button>
      </div>
      <div style={{ 
        display: 'inline-block', 
        backgroundColor: colors.gridBackground, 
        padding: '10px', 
        borderRadius: '5px' 
      }}>
        {Array.from({ length: GRID_SIZE }).map((_, y) => (
          <div key={y} style={{ display: 'flex' }}>
            {Array.from({ length: GRID_SIZE }).map((_, x) => {
              const isSnakeHead = snake[0].x === x && snake[0].y === y;
              const isSnakeBody = snake.slice(1).some(segment => segment.x === x && segment.y === y);
              const isFood = food.x === x && food.y === y;
              
              let content = null;
              let cellColor = 'transparent';
              if (isSnakeHead) {
                content = SNAKE_HEAD;
                cellColor = colors.snake;
              } else if (isSnakeBody) {
                cellColor = colors.snake;
              } else if (isFood) {
                content = food.emoji;
                cellColor = colors.food;
              }

              return (
                <div key={x} style={{ 
                  width: CELL_SIZE, 
                  height: CELL_SIZE, 
                  backgroundColor: cellColor,
                  border: `1px solid ${colors.gridBackground}`,
                  fontSize: '16px',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center'
                }}>
                  {content}
                </div>
              );
            })}
          </div>
        ))}
      </div>
      <p style={{ fontSize: '20px', margin: '20px 0' }}>Score: {score}</p>
      <p>Difficulty: {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}</p>
      {gameOver && (
        <div>
          <p style={{ fontSize: '24px', fontWeight: 'bold' }}>Game Over!</p>
          <button 
            onClick={resetGame}
            style={{
              backgroundColor: colors.food,
              color: colors.text,
              border: 'none',
              padding: '10px 20px',
              fontSize: '16px',
              borderRadius: '5px',
              cursor: 'pointer'
            }}
          >
            Play Again
          </button>
        </div>
      )}
      <p>Use arrow keys to move the snake</p>
    </div>
  );
};

export default AISnakeGame;