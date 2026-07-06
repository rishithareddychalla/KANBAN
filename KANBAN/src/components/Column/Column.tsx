import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Plus, Inbox } from 'lucide-react';
import type { Column as ColumnType, Task } from '../../types';
import { SortableCard } from '../Card/SortableCard';

interface ColumnProps {
  column: ColumnType;
  tasks: Task[];
  onAddTask: (columnId: string) => void;
  onEditTask: (task: Task) => void;
  onDeleteTask: (id: string) => void;
}

export const Column: React.FC<ColumnProps> = ({
  column,
  tasks,
  onAddTask,
  onEditTask,
  onDeleteTask,
}) => {
  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
    data: {
      type: 'Column',
      columnId: column.id,
    },
  });

  const getHeaderDotColor = (id: string) => {
    switch (id) {
      case 'todo':
        return 'bg-indigo-400 shadow-[0_0_8px_rgba(129,140,248,0.6)]';
      case 'in-progress':
        return 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.6)]';
      case 'done':
        return 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]';
      default:
        return 'bg-slate-400';
    }
  };

  return (
    <div
      ref={setNodeRef}
      className={`glass-panel flex flex-col rounded-2xl w-full min-w-[280px] sm:min-w-[320px] md:w-[350px] shrink-0 border p-4 transition-all duration-300 max-h-[75vh] md:max-h-[calc(100vh-220px)]
        ${isOver 
          ? 'border-brand-500/40 bg-slate-900/60 ring-2 ring-brand-500/20 scale-[1.01]' 
          : 'border-white/5 hover:border-white/10'
        }`}
    >
      {/* Column Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className={`w-2.5 h-2.5 rounded-full ${getHeaderDotColor(column.id)}`} />
          <h3 className="font-display font-bold text-slate-100 text-base tracking-wide">
            {column.title}
          </h3>
          <span className="ml-1.5 px-2 py-0.5 text-xs font-semibold rounded-md bg-white/5 border border-white/5 text-slate-400">
            {tasks.length}
          </span>
        </div>

        {/* Add Card Button */}
        <button
          onClick={() => onAddTask(column.id)}
          className="p-1.5 rounded-lg border border-white/5 text-slate-400 hover:text-slate-100 hover:bg-white/5 hover:border-white/10 transition-all duration-200"
          title="Add New Task"
          aria-label="Add New Task"
        >
          <Plus size={16} />
        </button>
      </div>

      {/* Cards List (Scrollable) */}
      <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-3 min-h-[150px] transition-all">
        <SortableContext items={column.taskIds} strategy={verticalListSortingStrategy}>
          {tasks.length > 0 ? (
            tasks.map((task) => (
              <SortableCard
                key={task.id}
                task={task}
                onEdit={onEditTask}
                onDelete={onDeleteTask}
              />
            ))
          ) : (
            /* Empty State */
            <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-white/5 rounded-xl p-8 text-center text-slate-500 min-h-[150px]">
              <Inbox size={28} className="mb-2 text-slate-600 stroke-[1.5]" />
              <p className="text-xs font-medium text-slate-400 mb-0.5">No tasks yet</p>
              <p className="text-[10px] text-slate-500">Drag items here or click "+" to add</p>
            </div>
          )}
        </SortableContext>
      </div>
    </div>
  );
};
