import React, { useState, useEffect, useRef } from 'react';
import { X, Calendar, Clock, Tag, Plus, CheckSquare, Trash2, Flag } from 'lucide-react';
import type { Task, Priority, Subtask } from '../../types';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (
    title: string,
    description: string,
    priority: Priority,
    columnId?: string,
    dueDate?: string,
    estimatedHours?: number,
    tags?: string[],
    subtasks?: Subtask[]
  ) => void;
  task?: Task; // If provided, we are in Edit Mode
}

export const TaskModal: React.FC<TaskModalProps> = ({
  isOpen,
  onClose,
  onSave,
  task,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<Priority>('medium');
  const [columnId, setColumnId] = useState('todo');
  const [dueDate, setDueDate] = useState('');
  const [estimatedHours, setEstimatedHours] = useState<number>(0);
  const [tagsText, setTagsText] = useState('');
  const [subtasks, setSubtasks] = useState<Subtask[]>([]);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [error, setError] = useState('');
  const [isRendered, setIsRendered] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  const modalRef = useRef<HTMLDivElement>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);

  // Initialize fields on open
  useEffect(() => {
    if (isOpen) {
      setIsRendered(true);
      setTimeout(() => setIsAnimating(true), 10); // Trigger transition
      if (task) {
        setTitle(task.title);
        setDescription(task.description);
        setPriority(task.priority);
        setColumnId(task.columnId);
        setDueDate(task.dueDate || '');
        setEstimatedHours(task.estimatedHours || 0);
        setTagsText(task.tags?.join(', ') || '');
        setSubtasks(task.subtasks || []);
      } else {
        setTitle('');
        setDescription('');
        setPriority('medium');
        setColumnId('todo');
        setDueDate('');
        setEstimatedHours(0);
        setTagsText('');
        setSubtasks([]);
      }
      setError('');
      setNewSubtaskTitle('');
      
      // Auto focus title input
      setTimeout(() => titleInputRef.current?.focus(), 150);
    } else {
      setIsAnimating(false);
      const timer = setTimeout(() => setIsRendered(false), 200); // Wait for transition
      return () => clearTimeout(timer);
    }
  }, [isOpen, task]);

  // Handle keyboard events (ESC to close)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const handleClose = () => {
    setIsAnimating(false);
    setTimeout(onClose, 200);
  };

  const handleAddSubtask = () => {
    if (!newSubtaskTitle.trim()) return;
    const newSubtask: Subtask = {
      id: 'subtask_' + Math.random().toString(36).substring(2, 11),
      title: newSubtaskTitle.trim(),
      isCompleted: false,
    };
    setSubtasks([...subtasks, newSubtask]);
    setNewSubtaskTitle('');
  };

  const handleToggleSubtask = (subtaskId: string) => {
    setSubtasks(
      subtasks.map((st) => (st.id === subtaskId ? { ...st, isCompleted: !st.isCompleted } : st))
    );
  };

  const handleDeleteSubtask = (subtaskId: string) => {
    setSubtasks(subtasks.filter((st) => st.id !== subtaskId));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Title is required.');
      titleInputRef.current?.focus();
      return;
    }

    // Parse tags (comma separated, trimmed, non-empty)
    const tags = tagsText
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    onSave(
      title,
      description,
      priority,
      columnId,
      dueDate || undefined,
      estimatedHours,
      tags,
      subtasks
    );
    handleClose();
  };

  if (!isRendered) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-300 overflow-y-auto
        ${isAnimating ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-950/70 backdrop-blur-md"
        onClick={handleClose}
      />

      {/* Modal Content */}
      <div
        ref={modalRef}
        className={`glass-modal w-full max-w-xl rounded-2xl border p-6 shadow-2xl relative z-10 transition-all duration-300 transform max-h-[90vh] overflow-y-auto
          ${isAnimating ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4'}`}
      >
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-white/5 border border-transparent hover:border-white/5 transition-all duration-200"
          aria-label="Close modal"
        >
          <X size={18} />
        </button>

        {/* Modal Header */}
        <h3 className="font-display font-bold text-lg text-slate-100 mb-5 tracking-wide">
          {task ? 'Edit Task Details' : 'Create New Task'}
        </h3>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Title Input */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="task-title" className="text-xs font-semibold text-slate-400">
              Task Title <span className="text-rose-400">*</span>
            </label>
            <input
              id="task-title"
              ref={titleInputRef}
              type="text"
              placeholder="e.g. Design user profile dashboard"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (e.target.value.trim()) setError('');
              }}
              className={`px-3.5 py-2.5 rounded-xl bg-slate-900/60 border text-slate-100 text-sm font-sans tracking-wide placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:bg-slate-900 transition-all duration-200
                ${error ? 'border-rose-500/50 focus:border-rose-500' : 'border-white/5 focus:border-brand-500/60'}`}
            />
            {error && (
              <span className="text-[11px] font-semibold text-rose-400 flex items-center gap-1 mt-0.5">
                {error}
              </span>
            )}
          </div>

          {/* Description Input */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="task-desc" className="text-xs font-semibold text-slate-400">
              Description
            </label>
            <textarea
              id="task-desc"
              rows={3}
              placeholder="Provide a detailed description of the task..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="px-3.5 py-2.5 rounded-xl bg-slate-900/60 border border-white/5 text-slate-100 text-sm font-sans tracking-wide placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500/60 focus:bg-slate-900 transition-all duration-200 resize-none"
            />
          </div>

          {/* PROPERTIES SECTION */}
          <div className="flex flex-col gap-3 p-4 rounded-xl bg-slate-950/40 border border-white/5">
            <div className="flex items-center gap-2 text-slate-300 font-display font-semibold text-xs pb-2 border-b border-white/5">
              <div className="p-1 rounded bg-amber-500/10 text-amber-500">
                <Flag size={12} />
              </div>
              <span>Properties</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-1">
              {/* Status Select */}
              <div className="flex flex-col gap-1.5">
                <label htmlFor="task-status" className="text-[11px] font-semibold text-slate-400">
                  Status
                </label>
                <select
                  id="task-status"
                  value={columnId}
                  onChange={(e) => setColumnId(e.target.value)}
                  className="px-3 py-2 rounded-xl bg-slate-900/60 border border-white/5 text-slate-200 text-xs focus:outline-none focus:border-brand-500/60 focus:bg-slate-900 transition-all"
                >
                  <option value="todo">To Do</option>
                  <option value="in-progress">In Progress</option>
                  <option value="done">Done</option>
                </select>
              </div>

              {/* Priority Select */}
              <div className="flex flex-col gap-1.5">
                <label htmlFor="task-priority" className="text-[11px] font-semibold text-slate-400">
                  Priority
                </label>
                <select
                  id="task-priority"
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as Priority)}
                  className="px-3 py-2 rounded-xl bg-slate-900/60 border border-white/5 text-slate-200 text-xs focus:outline-none focus:border-brand-500/60 focus:bg-slate-900 transition-all"
                >
                  <option value="low">Low Priority</option>
                  <option value="medium">Medium Priority</option>
                  <option value="high">High Priority</option>
                </select>
              </div>

              {/* Due Date */}
              <div className="flex flex-col gap-1.5">
                <label htmlFor="task-duedate" className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
                  <Calendar size={11} className="text-slate-500" />
                  <span>Due Date</span>
                </label>
                <input
                  id="task-duedate"
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="px-3 py-1.5 rounded-xl bg-slate-900/60 border border-white/5 text-slate-200 text-xs focus:outline-none focus:border-brand-500/60 focus:bg-slate-900 transition-all"
                />
              </div>

              {/* Estimated Hours */}
              <div className="flex flex-col gap-1.5">
                <label htmlFor="task-hours" className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
                  <Clock size={11} className="text-slate-500" />
                  <span>Estimated Hours</span>
                </label>
                <input
                  id="task-hours"
                  type="number"
                  min="0"
                  value={estimatedHours}
                  onChange={(e) => setEstimatedHours(Math.max(0, parseInt(e.target.value) || 0))}
                  className="px-3 py-1.5 rounded-xl bg-slate-900/60 border border-white/5 text-slate-200 text-xs focus:outline-none focus:border-brand-500/60 focus:bg-slate-900 transition-all"
                />
              </div>
            </div>

            {/* Tags Text Input */}
            <div className="flex flex-col gap-1.5 mt-1">
              <label htmlFor="task-tags" className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
                <Tag size={11} className="text-slate-500" />
                <span>Tags (comma-separated)</span>
              </label>
              <input
                id="task-tags"
                type="text"
                placeholder="urgent, bug-fix, feature"
                value={tagsText}
                onChange={(e) => setTagsText(e.target.value)}
                className="px-3.5 py-2 rounded-xl bg-slate-900/60 border border-white/5 text-slate-200 text-xs placeholder-slate-500 focus:outline-none focus:border-brand-500/60 focus:bg-slate-900 transition-all"
              />
            </div>
          </div>

          {/* SUBTASKS SECTION */}
          <div className="flex flex-col gap-3 p-4 rounded-xl bg-slate-950/40 border border-white/5">
            <div className="flex items-center gap-2 text-slate-300 font-display font-semibold text-xs pb-2 border-b border-white/5">
              <div className="p-1 rounded bg-emerald-500/10 text-emerald-500">
                <CheckSquare size={12} />
              </div>
              <span>Subtasks</span>
            </div>

            {/* List of subtasks */}
            {subtasks.length > 0 && (
              <div className="flex flex-col gap-1.5 max-h-[140px] overflow-y-auto pr-1">
                {subtasks.map((st) => (
                  <div
                    key={st.id}
                    className="flex items-center justify-between p-2 rounded-lg bg-slate-900/40 border border-white/5 group/sub"
                  >
                    <label className="flex items-center gap-2.5 cursor-pointer select-none text-slate-300 text-xs">
                      <input
                        type="checkbox"
                        checked={st.isCompleted}
                        onChange={() => handleToggleSubtask(st.id)}
                        className="rounded border-white/10 text-brand-500 focus:ring-brand-500/30 bg-slate-950"
                      />
                      <span className={st.isCompleted ? 'line-through text-slate-500' : ''}>
                        {st.title}
                      </span>
                    </label>
                    <button
                      type="button"
                      onClick={() => handleDeleteSubtask(st.id)}
                      className="opacity-0 group-hover/sub:opacity-100 p-1 rounded hover:bg-rose-500/10 text-slate-500 hover:text-rose-400 transition-all"
                      title="Delete Subtask"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Add Subtask Form */}
            <div className="flex gap-2 items-center">
              <input
                type="text"
                placeholder="Add a subtask"
                value={newSubtaskTitle}
                onChange={(e) => setNewSubtaskTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddSubtask();
                  }
                }}
                className="flex-1 px-3.5 py-1.5 rounded-xl bg-slate-900/60 border border-white/5 text-slate-200 text-xs placeholder-slate-500 focus:outline-none focus:border-brand-500/60 focus:bg-slate-900 transition-all"
              />
              <button
                type="button"
                onClick={handleAddSubtask}
                className="p-1.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white transition-all shadow-md shadow-brand-500/20"
                title="Add Subtask"
              >
                <Plus size={14} />
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 mt-4 pt-4 border-t border-white/5">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-slate-200 bg-white/5 hover:bg-white/10 border border-white/5 transition-all duration-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-brand-600 hover:bg-brand-500 shadow-[0_4px_16px_rgba(124,58,237,0.3)] hover:shadow-[0_4px_20px_rgba(124,58,237,0.45)] transition-all duration-200"
            >
              {task ? 'Save Changes' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
