import React from 'react';
import { Calendar, Edit3, Trash2, Clock, CheckSquare } from 'lucide-react';
import type { Task, Priority } from '../../types';

interface CardProps {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
  isDragging?: boolean;
  dragHandleProps?: any;
}

export const Card: React.FC<CardProps> = ({
  task,
  onEdit,
  onDelete,
  isDragging = false,
  dragHandleProps,
}) => {
  const getPriorityStyles = (p: Priority) => {
    switch (p) {
      case 'high':
        return 'text-rose-400 bg-rose-500/10 border-rose-500/20 shadow-[0_0_12px_rgba(244,63,94,0.15)]';
      case 'medium':
        return 'text-amber-400 bg-amber-500/10 border-amber-500/20 shadow-[0_0_12px_rgba(245,158,11,0.15)]';
      case 'low':
        return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20 shadow-[0_0_12px_rgba(16,185,129,0.15)]';
      default:
        return 'text-slate-400 bg-slate-500/10 border-slate-500/20';
    }
  };

  const formatDate = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return isoString;
    }
  };

  const subtasksCompleted = task.subtasks?.filter(st => st.isCompleted).length || 0;
  const totalSubtasks = task.subtasks?.length || 0;
  const subtasksPercent = totalSubtasks > 0 ? Math.round((subtasksCompleted / totalSubtasks) * 100) : 0;

  // Overdue check
  const isOverdue = task.dueDate && 
                    new Date(task.dueDate).setHours(23, 59, 59, 999) < Date.now() && 
                    task.columnId !== 'done';

  return (
    <div
      className={`group relative flex flex-col gap-3 p-4 rounded-xl transition-all duration-300 border select-none
        ${isDragging 
          ? 'glass-card opacity-40 border-dashed border-purple-500/50 shadow-none' 
          : 'glass-card shadow-card hover:shadow-[0_12px_24px_-4px_rgba(0,0,0,0.5),0_0_20px_rgba(139,92,246,0.15)] hover:border-brand-500/30 hover:-translate-y-1.5 hover:bg-slate-800/60 cursor-grab active:cursor-grabbing'
        }`}
      {...dragHandleProps}
    >
      {/* Priority & Actions Header */}
      <div className="flex items-center justify-between">
        <span
          className={`px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider rounded-full border ${getPriorityStyles(
            task.priority
          )}`}
        >
          {task.priority}
        </span>

        {/* Action Buttons (Fades in on hover) */}
        <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit(task);
            }}
            className="p-1.5 rounded-md text-slate-400 hover:text-slate-200 hover:bg-slate-700/60 transition-colors"
            title="Edit Task"
            aria-label="Edit Task"
          >
            <Edit3 size={14} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(task.id);
            }}
            className="p-1.5 rounded-md text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
            title="Delete Task"
            aria-label="Delete Task"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* Task Content */}
      <div className="flex flex-col gap-1.5">
        <h4 className="font-semibold text-slate-100 font-display text-sm tracking-wide leading-snug group-hover:text-purple-300 transition-colors">
          {task.title}
        </h4>
        {task.description && (
          <p className="text-xs text-slate-400 font-sans line-clamp-3 leading-relaxed break-words whitespace-pre-wrap">
            {task.description}
          </p>
        )}
      </div>

      {/* Tags */}
      {task.tags && task.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-0.5">
          {task.tags.map((t, idx) => (
            <span
              key={idx}
              className="px-1.5 py-0.5 rounded-md bg-purple-500/10 border border-purple-500/20 text-purple-300 text-[9px] font-semibold uppercase tracking-wider"
            >
              {t}
            </span>
          ))}
        </div>
      )}

      {/* Subtasks Progress */}
      {totalSubtasks > 0 && (
        <div className="flex flex-col gap-1 mt-0.5">
          <div className="flex justify-between items-center text-[10px] text-slate-400 font-medium">
            <span className="flex items-center gap-1">
              <CheckSquare size={10} className="text-slate-500" />
              <span>Subtasks</span>
            </span>
            <span>
              {subtasksCompleted}/{totalSubtasks}
            </span>
          </div>
          <div className="h-1 w-full bg-slate-800/80 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all duration-300"
              style={{ width: `${subtasksPercent}%` }}
            />
          </div>
        </div>
      )}

      {/* Divider */}
      <div className="h-px bg-white/5 my-0.5" />

      {/* Footer Info */}
      <div className="flex items-center justify-between text-[11px] text-slate-500">
        <div className="flex items-center gap-2">
          {task.dueDate ? (
            <div className={`flex items-center gap-1 ${isOverdue ? 'text-rose-400 font-semibold' : 'text-slate-500'}`}>
              <Calendar size={11} className={isOverdue ? 'text-rose-400' : 'text-slate-600'} />
              <span>Due: {formatDate(task.dueDate)}</span>
            </div>
          ) : (
            <div className="flex items-center gap-1">
              <Calendar size={11} className="text-slate-600" />
              <span>{formatDate(task.createdAt)}</span>
            </div>
          )}

          {task.estimatedHours !== undefined && task.estimatedHours > 0 && (
            <div className="flex items-center gap-1 border-l border-white/5 pl-2">
              <Clock size={11} className="text-slate-600" />
              <span>{task.estimatedHours}h</span>
            </div>
          )}
        </div>
        
        {/* Subtle dot indicator */}
        <span className={`w-1.5 h-1.5 rounded-full ${
          task.priority === 'high' ? 'bg-rose-500' : task.priority === 'medium' ? 'bg-amber-500' : 'bg-emerald-500'
        }`} />
      </div>
    </div>
  );
};
