export type Priority = 'low' | 'medium' | 'high';

export interface Subtask {
  id: string;
  title: string;
  isCompleted: boolean;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  priority: Priority;
  createdAt: string; // ISO string format
  columnId: string;
  dueDate?: string;
  estimatedHours?: number;
  tags?: string[];
  subtasks?: Subtask[];
}

export interface Column {
  id: string;
  title: string;
  taskIds: string[]; // List of task IDs in this column (for ordering)
}

export interface BoardState {
  columns: Record<string, Column>;
  columnOrder: string[];
  tasks: Record<string, Task>;
}

export interface FilterState {
  searchQuery: string;
  priorityFilter: Priority | 'all';
}
