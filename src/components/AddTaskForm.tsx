import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface AddTaskFormProps {
  onAddTask: (title: string) => void;
  isLoading: boolean;
}

export function AddTaskForm({ onAddTask, isLoading }: AddTaskFormProps) {
  const [title, setTitle] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (title.trim()) {
      onAddTask(title);
      setTitle("");
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value);
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 mb-6">
      <Input
        type="text"
        placeholder="Add a new task..."
        value={title}
        onChange={handleChange}
        disabled={isLoading}
        className="flex-1"
      />
      <Button type="submit" disabled={!title.trim() || isLoading}>
        <Plus className="h-4 w-4 mr-1" />
        Add
      </Button>
    </form>
  );
}
