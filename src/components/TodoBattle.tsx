import React, { useState, useEffect, useRef } from "react";
import { Task } from "@/types/task";
import { Button } from "@/components/ui/button";
import { X, Play, RotateCcw, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";

interface TodoBattleProps {
  tasks: Task[];
  onDeleteTask: (taskId: number) => void;
  onClose: () => void;
}

interface GameTodo extends Task {
  x: number;
  y: number;
  speed: number;
  angle: number;
  clicks: number;
  size: number;
  lastFireTime: number;
  fireRate: number;
  projectilesPerShot: number;
}

interface Projectile {
  id: string;
  x: number;
  y: number;
  angle: number;
  speed: number;
  size: number;
  color: string;
  sourceId: number;
}

export function TodoBattle({ tasks, onDeleteTask, onClose }: TodoBattleProps) {
  const [gameTodos, setGameTodos] = useState<GameTodo[]>([]);
  const [projectiles, setProjectiles] = useState<Projectile[]>([]);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isPlaying, setIsPlaying] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [projectilesPerShot, setProjectilesPerShot] = useState(1);
  const [fireRateMultiplier, setFireRateMultiplier] = useState(1);
  const [survivalTime, setSurvivalTime] = useState(0);
  const gameAreaRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const gameStartTimeRef = useRef<number>(0);

  // Initialize game todos from tasks
  useEffect(() => {
    if (!isPlaying) {
      const initialGameTodos = tasks.map((task) => {
        return {
          ...task,
          x: Math.random() * 100, // Random position (percentage)
          y: Math.random() * 100,
          speed: 0.05 + Math.random() * 0.05, // Slower movement speed
          angle: Math.random() * 2 * Math.PI, // Random angle in radians
          clicks: 0,
          size: 80 + Math.random() * 40, // Random size between 80-120px
          lastFireTime: 0,
          fireRate: (1000 + Math.random() * 2000) * fireRateMultiplier, // Time between shots (ms)
          projectilesPerShot: projectilesPerShot,
        };
      });
      setGameTodos(initialGameTodos);
      setProjectiles([]);
    }
  }, [tasks, isPlaying, projectilesPerShot, fireRateMultiplier]);

  // Survival timer
  useEffect(() => {
    let timerInterval: number;
    
    if (isPlaying && !isGameOver) {
      gameStartTimeRef.current = Date.now();
      
      timerInterval = window.setInterval(() => {
        const elapsedTime = Math.floor((Date.now() - gameStartTimeRef.current) / 1000);
        setSurvivalTime(elapsedTime);
      }, 1000);
    }
    
    return () => {
      clearInterval(timerInterval);
    };
  }, [isPlaying, isGameOver]);

  // Track mouse position
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!gameAreaRef.current) return;
      
      const rect = gameAreaRef.current.getBoundingClientRect();
      setMousePosition({
        x: ((e.clientX - rect.left) / rect.width) * 100,
        y: ((e.clientY - rect.top) / rect.height) * 100,
      });
    };

    // Add mouse move event listener
    window.addEventListener("mousemove", handleMouseMove);
    
    // Initial position setup - make sure we have a valid cursor position
    // even before the user moves the mouse
    if (gameAreaRef.current) {
      const rect = gameAreaRef.current.getBoundingClientRect();
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      
      setMousePosition({
        x: (centerX / rect.width) * 100,
        y: (centerY / rect.height) * 100,
      });
    }
    
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

  // Game loop
  useEffect(() => {
    if (!isPlaying || isGameOver) return;
    
    // Check if there are any todos left to battle
    if (gameTodos.length === 0) {
      setIsPlaying(false);
      setIsGameOver(true);
      return;
    }

    const gameLoop = (timestamp: number) => {
      if (!lastTimeRef.current) {
        lastTimeRef.current = timestamp;
      }
      
      const deltaTime = timestamp - lastTimeRef.current;
      lastTimeRef.current = timestamp;

      // Update todos to slowly move around
      setGameTodos((prevTodos) => {
        return prevTodos.map((todo) => {
          // Slowly wander around
          const vx = Math.cos(todo.angle) * todo.speed;
          const vy = Math.sin(todo.angle) * todo.speed;
          
          // Keep todos within bounds
          let newX = todo.x + vx;
          let newY = todo.y + vy;
          let newAngle = todo.angle;
          
          // Bounce off edges
          if (newX < 0 || newX > 100) {
            newAngle = Math.PI - newAngle;
            newX = Math.max(0, Math.min(100, newX));
          }
          if (newY < 0 || newY > 100) {
            newAngle = -newAngle;
            newY = Math.max(0, Math.min(100, newY));
          }
          
          // Occasionally change direction randomly
          if (Math.random() < 0.01) {
            newAngle += (Math.random() - 0.5) * Math.PI / 2;
          }
          
          // Fire projectiles at player
          let shouldFire = false;
          let lastFireTime = todo.lastFireTime;
          
          if (timestamp - todo.lastFireTime > todo.fireRate) {
            shouldFire = true;
            lastFireTime = timestamp;
          }
          
          if (shouldFire) {
            // Calculate angle to player
            const dx = mousePosition.x - newX;
            const dy = mousePosition.y - newY;
            const angleToPlayer = Math.atan2(dy, dx);
            
            // Create multiple projectiles based on projectilesPerShot setting
            const newProjectiles: Projectile[] = [];
            
            for (let i = 0; i < todo.projectilesPerShot; i++) {
              // Add some randomness to the firing angle - more spread with more projectiles
              const spreadFactor = todo.projectilesPerShot > 1 ? 0.5 : 0.2;
              const randomSpread = (Math.random() - 0.5) * spreadFactor;
              
              // Create a new projectile
              const projectile: Projectile = {
                id: `${todo.id}-${Date.now()}-${Math.random()}-${i}`,
                x: newX,
                y: newY,
                angle: angleToPlayer + randomSpread,
                speed: 0.5 + Math.random() * 0.3, // Faster than todos
                size: 10 + Math.random() * 8,
                color: todo.clicks === 0 ? "primary" : 
                       todo.clicks === 1 ? "orange-500" : "destructive",
                sourceId: todo.id
              };
              
              newProjectiles.push(projectile);
            }
            
            setProjectiles(prev => [...prev, ...newProjectiles]);
          }
          
          return {
            ...todo,
            x: newX,
            y: newY,
            angle: newAngle,
            lastFireTime: lastFireTime
          };
        });
      });

      // Update projectiles
      setProjectiles(prevProjectiles => {
        return prevProjectiles
          .map(projectile => {
            const vx = Math.cos(projectile.angle) * projectile.speed;
            const vy = Math.sin(projectile.angle) * projectile.speed;
            
            return {
              ...projectile,
              x: projectile.x + vx,
              y: projectile.y + vy
            };
          })
          // Remove projectiles that are off-screen
          .filter(projectile => 
            projectile.x >= -5 && 
            projectile.x <= 105 && 
            projectile.y >= -5 && 
            projectile.y <= 105
          );
      });

      // Check for collisions between projectiles and mouse
      if (gameAreaRef.current) {
        const rect = gameAreaRef.current.getBoundingClientRect();
        const mousePixelX = (mousePosition.x / 100) * rect.width;
        const mousePixelY = (mousePosition.y / 100) * rect.height;
        const mouseRadius = 10; // mouse hit radius in pixels
        
        // For each projectile, check if it's colliding with the cursor
        for (const projectile of projectiles) {
          const projectilePixelX = (projectile.x / 100) * rect.width;
          const projectilePixelY = (projectile.y / 100) * rect.height;
          const projectileRadius = projectile.size / 2;
          
          const dx = projectilePixelX - mousePixelX;
          const dy = projectilePixelY - mousePixelY;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance < (projectileRadius + mouseRadius)) {
            // Collision detected
            setIsGameOver(true);
            setIsPlaying(false);
            return;
          }
        }
      }

      frameRef.current = requestAnimationFrame(gameLoop);
    };

    frameRef.current = requestAnimationFrame(gameLoop);
    
    return () => {
      cancelAnimationFrame(frameRef.current);
    };
  }, [isPlaying, isGameOver, mousePosition, gameTodos.length]);

  // Handle clicking on todos
  const handleTodoClick = (todoId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    
    setGameTodos((prevTodos) => {
      const updatedTodos = prevTodos.map((todo) => {
        if (todo.id === todoId) {
          const newClicks = todo.clicks + 1;
          
          // If clicked 3 times, the clicks will be 3, and we'll delete it
          if (newClicks >= 3) {
            setScore((prev) => prev + 1);
            // Delete from backend will happen after the state update
            return { ...todo, clicks: newClicks };
          }
          
          return { ...todo, clicks: newClicks };
        }
        return todo;
      });
      
      // Find the todo that was just clicked to check if it needs to be deleted
      const clickedTodo = updatedTodos.find(todo => todo.id === todoId);
      if (clickedTodo && clickedTodo.clicks >= 3) {
        // Delete the todo from the database
        setTimeout(() => {
          onDeleteTask(todoId);
        }, 100);
        
        // Remove it from the game
        const remainingTodos = updatedTodos.filter(todo => todo.id !== todoId);
        
        // Check if this was the last todo
        if (remainingTodos.length === 0) {
          // End the game with victory
          setTimeout(() => {
            setIsPlaying(false);
            setIsGameOver(true);
            setProjectiles([]);
          }, 300);
        }
        
        return remainingTodos;
      }
      
      return updatedTodos;
    });
  };

  const startGame = () => {
    setIsPlaying(true);
    setIsGameOver(false);
    setScore(0);
    setSurvivalTime(0);
    gameStartTimeRef.current = Date.now();
    lastTimeRef.current = 0;
  };

  const resetGame = () => {
    setIsPlaying(false);
    setIsGameOver(false);
    setScore(0);
    setProjectiles([]);
    setSurvivalTime(0);
    
    // Reset todos to initial state
    const resetTodos = tasks.map((task) => {
      return {
        ...task,
        x: Math.random() * 100,
        y: Math.random() * 100,
        speed: 0.05 + Math.random() * 0.05,
        angle: Math.random() * 2 * Math.PI,
        clicks: 0,
        size: 80 + Math.random() * 40,
        lastFireTime: 0,
        fireRate: (1000 + Math.random() * 2000) * fireRateMultiplier,
        projectilesPerShot: projectilesPerShot,
      };
    });
    
    setGameTodos(resetTodos);
  };

  const handleProjectileCountChange = (value: number[]) => {
    setProjectilesPerShot(value[0]);
  };
  
  const handleFireRateChange = (value: number[]) => {
    setFireRateMultiplier(value[0]);
  };
  
  // Format the survival time into minutes and seconds
  const formatSurvivalTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-card w-[90vw] h-[80vh] max-w-5xl rounded-xl shadow-xl flex flex-col overflow-hidden">
        <div className="flex justify-between items-center p-4 border-b">
          <div className="flex items-center space-x-4">
            <h2 className="text-xl font-bold">Todo Battle</h2>
            <div className="bg-primary/10 px-3 py-1 rounded-md">
              <span className="font-semibold">Score: {score}</span>
            </div>
            {isPlaying && (
              <div className="bg-secondary/80 flex items-center px-3 py-1 rounded-md">
                <Clock className="h-4 w-4 mr-1" />
                <span className="font-semibold">{formatSurvivalTime(survivalTime)}</span>
              </div>
            )}
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        <div 
          ref={gameAreaRef}
          className="flex-1 relative bg-accent/20 overflow-hidden"
        >
          {!isPlaying && !isGameOver && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 z-10">
              <h3 className="text-2xl font-bold mb-4">Ready to battle your todos?</h3>
              <p className="text-muted-foreground mb-4 max-w-md text-center">
                Click todos 3 times to destroy them. Avoid the projectiles they fire!
              </p>
              
              {gameTodos.length > 0 ? (
                <div className="flex flex-col items-center">
                  <div className="flex flex-col items-center space-y-6 mb-6 w-72">
                    <div className="flex flex-col space-y-2 w-full">
                      <div className="flex justify-between w-full">
                        <Label htmlFor="projectiles" className="text-sm">Projectiles per shot:</Label>
                        <span className="font-semibold text-primary">{projectilesPerShot}</span>
                      </div>
                      <Slider 
                        id="projectiles"
                        min={1} 
                        max={5} 
                        step={1} 
                        value={[projectilesPerShot]} 
                        onValueChange={handleProjectileCountChange}
                        className="w-full"
                      />
                      <div className="text-xs text-muted-foreground">
                        {projectilesPerShot === 1 ? "Easy" : 
                         projectilesPerShot === 2 ? "Medium" : 
                         projectilesPerShot === 3 ? "Hard" : 
                         projectilesPerShot === 4 ? "Very Hard" : "Extreme"}
                      </div>
                    </div>
                    
                    <div className="flex flex-col space-y-2 w-full">
                      <div className="flex justify-between w-full">
                        <Label htmlFor="fireRate" className="text-sm">Fire Rate Cooldown:</Label>
                        <span className="font-semibold text-primary">{fireRateMultiplier.toFixed(1)}x</span>
                      </div>
                      <Slider 
                        id="fireRate"
                        min={0.5} 
                        max={3.0} 
                        step={0.1} 
                        value={[fireRateMultiplier]} 
                        onValueChange={handleFireRateChange}
                        className="w-full"
                      />
                      <div className="text-xs text-muted-foreground">
                        {fireRateMultiplier < 1.0 ? "Rapid Fire (Harder)" : 
                         fireRateMultiplier <= 1.5 ? "Normal" : 
                         fireRateMultiplier <= 2.0 ? "Slow" : "Very Slow (Easier)"}
                      </div>
                    </div>
                  </div>
                  
                  <Button onClick={startGame} size="lg">
                    <Play className="mr-2 h-4 w-4" />
                    Start Game
                  </Button>
                </div>
              ) : (
                <div className="text-center">
                  <p className="text-destructive font-medium mb-2">No todos available!</p>
                  <p className="text-muted-foreground">Create some todos first to start the battle.</p>
                </div>
              )}
            </div>
          )}
          
          {isGameOver && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 z-10">
              <h3 className="text-2xl font-bold mb-2">
                {gameTodos.length === 0 ? "Victory!" : "Game Over!"}
              </h3>
              <p className="text-xl mb-2">Your score: {score}</p>
              <p className="text-lg mb-1">Survival time: {formatSurvivalTime(survivalTime)}</p>
              <p className="text-muted-foreground mb-6">
                {gameTodos.length === 0 
                  ? "You defeated all the todos!" 
                  : "A todo projectile hit you!"}
              </p>
              <Button onClick={resetGame} size="lg">
                <RotateCcw className="mr-2 h-4 w-4" />
                Play Again
              </Button>
            </div>
          )}
          
          {/* Mouse cursor indicator */}
          {isPlaying && (
            <div 
              className="absolute w-5 h-5 rounded-full border-2 border-primary bg-transparent z-20 pointer-events-none"
              style={{ 
                left: `calc(${mousePosition.x}% - 10px)`, 
                top: `calc(${mousePosition.y}% - 10px)` 
              }}
            />
          )}
          
          {/* Render projectiles */}
          {isPlaying && projectiles.map((projectile) => (
            <div
              key={projectile.id}
              className={cn(
                "absolute rounded-full",
                projectile.color === "primary" ? "bg-primary" :
                projectile.color === "orange-500" ? "bg-orange-500" :
                "bg-destructive"
              )}
              style={{
                left: `calc(${projectile.x}% - ${projectile.size/2}px)`,
                top: `calc(${projectile.y}% - ${projectile.size/2}px)`,
                width: `${projectile.size}px`,
                height: `${projectile.size}px`,
                transform: `rotate(${projectile.angle}rad)`,
                boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
              }}
            />
          ))}
          
          {/* Render todos */}
          {gameTodos.map((todo) => (
            <div
              key={todo.id}
              className={cn(
                "absolute flex items-center justify-center rounded-lg text-center p-2 cursor-pointer transition-colors",
                todo.clicks === 0 ? "bg-primary text-primary-foreground" :
                todo.clicks === 1 ? "bg-orange-500 text-white" :
                "bg-destructive text-destructive-foreground"
              )}
              style={{
                left: `calc(${todo.x}% - ${todo.size/2}px)`,
                top: `calc(${todo.y}% - ${todo.size/2}px)`,
                width: `${todo.size}px`,
                height: `${todo.size}px`,
                boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                transition: isPlaying ? "none" : "all 0.3s ease"
              }}
              onClick={(e) => isPlaying && handleTodoClick(todo.id, e)}
            >
              <div className="truncate text-sm">
                {todo.title}
                <div className="text-xs mt-1 font-bold">
                  {3 - todo.clicks} clicks left
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
