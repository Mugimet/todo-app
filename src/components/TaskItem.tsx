import { Checkbox } from "@/components/ui/checkbox";
import { Task } from "@/types/task";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";

interface TaskItemProps {
  task: Task;
  onToggleComplete: (task: Task) => void;
  onDelete: (taskId: number) => void;
}

export function TaskItem({ task, onToggleComplete, onDelete }: TaskItemProps) {
  const handleToggle = () => {
    onToggleComplete(task);
  };

  const handleDelete = () => {
    onDelete(task.id);
  };

  return (
    <div className="flex items-center justify-between py-3 border-b">
      <div className="flex items-center space-x-3">
        <Checkbox 
          checked={task.completed} 
          onCheckedChange={handleToggle}
          id={`task-${task.id}`}
        />
        <label 
          htmlFor={`task-${task.id}`} 
          className={`text-sm cursor-pointer ${
            task.completed ? "line-through text-muted-foreground" : ""
          }`}
        >
          {task.title}
        </label>
      </div>
      <Button 
        variant="ghost" 
        size="sm" 
        onClick={handleDelete}
        className="text-destructive hover:text-destructive/90 hover:bg-destructive/10"
      >
        <Trash2 className="h-4 w-4" />
        <span className="sr-only">Delete task</span>
      </Button>
    </div>
  );
}
