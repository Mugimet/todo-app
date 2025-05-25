import * as React from 'react';
import { useState, useEffect } from 'react';
import { Task } from '@/types/task';
import { AddTaskForm } from '@/components/AddTaskForm';
import { TaskList } from '@/components/TaskList';
import { TodoBattle } from '@/components/TodoBattle';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Gamepad2 } from 'lucide-react';

function App() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isBattleMode, setIsBattleMode] = useState(false);

  // Calculate completion progress
  const completedTasks = tasks.filter(task => task.completed).length;
  const progressPercentage = tasks.length > 0 
    ? Math.round((completedTasks / tasks.length) * 100) 
    : 0;

  // Fetch tasks on component mount
  useEffect(() => {
    fetchTasks();
  }, []);

  // Fetch all tasks from the API
  const fetchTasks = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch('/api/tasks');
      
      if (!response.ok) {
        throw new Error('Failed to fetch tasks');
      }
      
      const data = await response.json();
      setTasks(data);
    } catch (err) {
      console.error('Error fetching tasks:', err);
      setError('Failed to load tasks. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Add a new task
  const handleAddTask = async (title: string) => {
    try {
      setIsAdding(true);
      setError(null);
      
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to add task');
      }
      
      const newTask = await response.json();
      setTasks([newTask, ...tasks]);
    } catch (err) {
      console.error('Error adding task:', err);
      setError('Failed to add task. Please try again.');
    } finally {
      setIsAdding(false);
    }
  };

  // Toggle task completion status
  const handleToggleComplete = async (task: Task) => {
    try {
      setError(null);
      
      // Optimistically update UI
      const updatedTasks = tasks.map(t => 
        t.id === task.id ? { ...t, completed: !t.completed } : t
      );
      setTasks(updatedTasks);
      
      // Update in the backend
      const response = await fetch(`/api/tasks/${task.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ completed: !task.completed }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update task');
      }
      
      // No need to update state again as we already did optimistically
    } catch (err) {
      console.error('Error updating task:', err);
      setError('Failed to update task. Please try again.');
      
      // Revert optimistic update
      fetchTasks();
    }
  };

  // Delete a task
  const handleDeleteTask = async (taskId: number) => {
    try {
      setError(null);
      
      // Optimistically update UI
      const updatedTasks = tasks.filter(task => task.id !== taskId);
      setTasks(updatedTasks);
      
      // Delete from the backend
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete task');
      }
      
      // No need to update state again as we already did optimistically
    } catch (err) {
      console.error('Error deleting task:', err);
      setError('Failed to delete task. Please try again.');
      
      // Revert optimistic update
      fetchTasks();
    }
  };

  // Toggle battle mode
  const toggleBattleMode = () => {
    // Only allow battle mode if there are uncompleted tasks
    const uncompletedTasks = tasks.filter(task => !task.completed);
    if (!isBattleMode && uncompletedTasks.length === 0) {
      setError("You need at least one active todo to start battle mode!");
      setTimeout(() => setError(null), 3000);
      return;
    }
    
    setIsBattleMode(!isBattleMode);
  };

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container max-w-2xl mx-auto px-4">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex justify-between items-center">
              <CardTitle className="text-2xl">Todo App</CardTitle>
              {tasks.length > 0 && (
                <Button 
                  onClick={toggleBattleMode} 
                  variant="outline"
                  className="gap-2"
                  disabled={tasks.filter(task => !task.completed).length === 0}
                  title={tasks.filter(task => !task.completed).length === 0 ? 
                    "Complete all active todos first to start battle" : 
                    "Start Todo Battle"}
                >
                  <Gamepad2 className="h-4 w-4" />
                  Battle Mode
                </Button>
              )}
            </div>
            <div className="mt-2">
              <div className="flex justify-between text-xs text-muted-foreground mb-1">
                <span>Progress</span>
                <span>{completedTasks} of {tasks.length} tasks completed</span>
              </div>
              <Progress value={progressPercentage} className="h-2" />
            </div>
          </CardHeader>
          <CardContent>
            <AddTaskForm onAddTask={handleAddTask} isLoading={isAdding} />
            
            {error && (
              <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md mb-4">
                {error}
              </div>
            )}
            
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">
                Loading tasks...
              </div>
            ) : (
              <TaskList 
                tasks={tasks}
                onToggleComplete={handleToggleComplete}
                onDelete={handleDeleteTask}
              />
            )}
          </CardContent>
        </Card>
      </div>

      {isBattleMode && (
        <TodoBattle 
          tasks={tasks.filter(task => !task.completed)} 
          onDeleteTask={handleDeleteTask}
          onClose={toggleBattleMode}
        />
      )}
    </div>
  );
}

export default App;
