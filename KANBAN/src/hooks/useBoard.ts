import { useState, useEffect, useCallback } from 'react';
import type { BoardState, Task, Priority, Column, Subtask } from '../types';

const LOCAL_STORAGE_KEY = 'taskflow_board_state';

const defaultColumns: Record<string, Column> = {
  'todo': {
    id: 'todo',
    title: 'To Do',
    taskIds: [],
  },
  'in-progress': {
    id: 'in-progress',
    title: 'In Progress',
    taskIds: [],
  },
  'done': {
    id: 'done',
    title: 'Done',
    taskIds: [],
  },
};

const initialBoardState: BoardState = {
  columns: defaultColumns,
  columnOrder: ['todo', 'in-progress', 'done'],
  tasks: {},
};

export const useBoard = () => {
  const [boardState, setBoardState] = useState<BoardState>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.columns && parsed.columnOrder && parsed.tasks) {
          // Double check columns structure and default columns
          const columns = { ...defaultColumns };
          Object.keys(parsed.columns).forEach(key => {
            columns[key] = {
              ...columns[key],
              ...parsed.columns[key],
              taskIds: Array.isArray(parsed.columns[key].taskIds) ? parsed.columns[key].taskIds : []
            };
          });
          return {
            columns,
            columnOrder: Array.isArray(parsed.columnOrder) ? parsed.columnOrder : ['todo', 'in-progress', 'done'],
            tasks: typeof parsed.tasks === 'object' && parsed.tasks !== null ? parsed.tasks : {}
          };
        }
      } catch (e) {
        console.error('Failed to parse board state from localStorage', e);
      }
    }
    return initialBoardState;
  });

  // Save to localStorage automatically on state changes
  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(boardState));
  }, [boardState]);

  // Helper to generate custom IDs safely
  const generateId = (): string => {
    if (typeof window !== 'undefined' && window.crypto && typeof window.crypto.randomUUID === 'function') {
      return window.crypto.randomUUID();
    }
    return 'task_' + Math.random().toString(36).substring(2, 11);
  };

  const addTask = useCallback((
    columnId: string,
    title: string,
    description: string,
    priority: Priority,
    dueDate?: string,
    estimatedHours?: number,
    tags?: string[],
    subtasks?: Subtask[]
  ) => {
    const taskId = generateId();
    const newTask: Task = {
      id: taskId,
      title: title.trim(),
      description: description.trim(),
      priority,
      createdAt: new Date().toISOString(),
      columnId,
      dueDate,
      estimatedHours,
      tags,
      subtasks: subtasks || [],
    };

    setBoardState(prev => {
      const column = prev.columns[columnId];
      if (!column) return prev;

      return {
        ...prev,
        tasks: {
          ...prev.tasks,
          [taskId]: newTask,
        },
        columns: {
          ...prev.columns,
          [columnId]: {
            ...column,
            taskIds: [...column.taskIds, taskId],
          },
        },
      };
    });
  }, []);

  const updateTask = useCallback((
    taskId: string,
    title: string,
    description: string,
    priority: Priority,
    columnId?: string,
    dueDate?: string,
    estimatedHours?: number,
    tags?: string[],
    subtasks?: Subtask[]
  ) => {
    setBoardState(prev => {
      const task = prev.tasks[taskId];
      if (!task) return prev;

      const currentColId = task.columnId;
      const targetColId = columnId || currentColId;
      
      let updatedColumns = { ...prev.columns };
      
      // If columnId has changed, move the task to the new column
      if (currentColId !== targetColId) {
        const sourceCol = prev.columns[currentColId];
        const destCol = prev.columns[targetColId];
        
        if (sourceCol && destCol) {
          updatedColumns = {
            ...prev.columns,
            [currentColId]: {
              ...sourceCol,
              taskIds: sourceCol.taskIds.filter(id => id !== taskId),
            },
            [targetColId]: {
              ...destCol,
              taskIds: [...destCol.taskIds, taskId],
            },
          };
        }
      }

      return {
        ...prev,
        columns: updatedColumns,
        tasks: {
          ...prev.tasks,
          [taskId]: {
            ...task,
            title: title.trim(),
            description: description.trim(),
            priority,
            columnId: targetColId,
            dueDate,
            estimatedHours,
            tags,
            subtasks: subtasks || [],
          },
        },
      };
    });
  }, []);

  const deleteTask = useCallback((taskId: string) => {
    setBoardState(prev => {
      const task = prev.tasks[taskId];
      if (!task) return prev;

      const columnId = task.columnId;
      const column = prev.columns[columnId];
      if (!column) return prev;

      const newTasks = { ...prev.tasks };
      delete newTasks[taskId];

      return {
        ...prev,
        tasks: newTasks,
        columns: {
          ...prev.columns,
          [columnId]: {
            ...column,
            taskIds: column.taskIds.filter(id => id !== taskId),
          },
        },
      };
    });
  }, []);

  const reorderTasks = useCallback((columnId: string, newTaskIds: string[]) => {
    setBoardState(prev => {
      const column = prev.columns[columnId];
      if (!column) return prev;

      return {
        ...prev,
        columns: {
          ...prev.columns,
          [columnId]: {
            ...column,
            taskIds: newTaskIds,
          },
        },
      };
    });
  }, []);

  const moveTaskToColumn = useCallback((taskId: string, sourceColId: string, destColId: string, destIndex: number) => {
    setBoardState(prev => {
      const sourceCol = prev.columns[sourceColId];
      const destCol = prev.columns[destColId];
      const task = prev.tasks[taskId];

      if (!sourceCol || !destCol || !task) return prev;

      // Remove from source task list
      const sourceTaskIds = sourceCol.taskIds.filter(id => id !== taskId);
      
      // Add to dest task list at specified index
      const destTaskIds = [...destCol.taskIds];
      destTaskIds.splice(destIndex, 0, taskId);

      // Update the columnId on the task object
      const updatedTask = {
        ...task,
        columnId: destColId
      };

      return {
        ...prev,
        tasks: {
          ...prev.tasks,
          [taskId]: updatedTask,
        },
        columns: {
          ...prev.columns,
          [sourceColId]: {
            ...sourceCol,
            taskIds: sourceTaskIds,
          },
          [destColId]: {
            ...destCol,
            taskIds: destTaskIds,
          },
        },
      };
    });
  }, []);

  const clearBoard = useCallback(() => {
    setBoardState({
      columns: {
        'todo': { id: 'todo', title: 'To Do', taskIds: [] },
        'in-progress': { id: 'in-progress', title: 'In Progress', taskIds: [] },
        'done': { id: 'done', title: 'Done', taskIds: [] },
      },
      columnOrder: ['todo', 'in-progress', 'done'],
      tasks: {},
    });
  }, []);

  return {
    boardState,
    setBoardState,
    addTask,
    updateTask,
    deleteTask,
    reorderTasks,
    moveTaskToColumn,
    clearBoard,
  };
};
