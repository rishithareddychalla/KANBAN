import { useState } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import type {
  DragStartEvent,
  DragOverEvent,
  DragEndEvent,
} from '@dnd-kit/core';
import { arrayMove, sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { Search, Trash2, Kanban, Filter, BarChart3, Tag, List, LayoutGrid, Edit3 } from 'lucide-react';
import { useBoard } from '../../hooks/useBoard';
import { Column } from '../Column/Column';
import { Card } from '../Card/Card';
import { TaskModal } from '../Modal/TaskModal';
import { ConfirmationModal } from '../Modal/ConfirmationModal';
import { BoardStats } from './BoardStats';
import type { Task, Priority, Subtask } from '../../types';

export const Board = () => {
  const {
    boardState,
    setBoardState,
    addTask,
    updateTask,
    deleteTask,
    reorderTasks,
    clearBoard,
  } = useBoard();

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<Priority | 'all'>('all');
  const [selectedTag, setSelectedTag] = useState<string | 'all'>('all');
  const [viewMode, setViewMode] = useState<'board' | 'list'>('board');
  const [showStats, setShowStats] = useState(false);
  const [showFilters, setShowFilters] = useState(true);

  // Dragging state for Overlay
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [activeTask, setActiveTask] = useState<Task | null>(null);

  // Modals state
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | undefined>(undefined);
  const [activeTargetColumnId, setActiveTargetColumnId] = useState<string | null>(null);

  const [isClearConfirmOpen, setIsClearConfirmOpen] = useState(false);
  const [deletingTaskId, setDeletingTaskId] = useState<string | null>(null);

  // Configure Sensors (distance constraint lets clicks on edit/delete register)
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Filter logic
  const matchesSearch = (task: Task) => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return true;
    const matchesTags = task.tags?.some(tag => tag.toLowerCase().includes(query)) || false;
    return (
      task.title.toLowerCase().includes(query) ||
      task.description.toLowerCase().includes(query) ||
      matchesTags
    );
  };

  const matchesPriority = (task: Task) => {
    if (priorityFilter === 'all') return true;
    return task.priority === priorityFilter;
  };

  const matchesTag = (task: Task) => {
    if (selectedTag === 'all') return true;
    return task.tags?.includes(selectedTag) || false;
  };

  const allUniqueTags = Array.from(
    new Set(
      Object.values(boardState.tasks)
        .flatMap((task) => task.tags || [])
    )
  );

  const totalTasksCount = Object.keys(boardState.tasks).length;

  // Task actions handlers
  const handleOpenAddTask = (columnId: string) => {
    setEditingTask(undefined);
    setActiveTargetColumnId(columnId);
    setIsTaskModalOpen(true);
  };

  const handleOpenEditTask = (task: Task) => {
    setEditingTask(task);
    setActiveTargetColumnId(task.columnId);
    setIsTaskModalOpen(true);
  };

  const handleSaveTask = (
    title: string,
    description: string,
    priority: Priority,
    columnId?: string,
    dueDate?: string,
    estimatedHours?: number,
    tags?: string[],
    subtasks?: Subtask[]
  ) => {
    if (editingTask) {
      updateTask(
        editingTask.id,
        title,
        description,
        priority,
        columnId,
        dueDate,
        estimatedHours,
        tags,
        subtasks
      );
    } else if (activeTargetColumnId) {
      const finalColId = columnId || activeTargetColumnId;
      addTask(
        finalColId,
        title,
        description,
        priority,
        dueDate,
        estimatedHours,
        tags,
        subtasks
      );
    }
  };

  const handleRequestDeleteTask = (taskId: string) => {
    setDeletingTaskId(taskId);
  };

  const handleConfirmDeleteTask = () => {
    if (deletingTaskId) {
      deleteTask(deletingTaskId);
      setDeletingTaskId(null);
    }
  };

  // Drag and Drop Event Handlers
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const taskId = active.id as string;
    setActiveTaskId(taskId);
    setActiveTask(boardState.tasks[taskId]);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    if (activeId === overId) return;

    const activeTaskObj = boardState.tasks[activeId];
    if (!activeTaskObj) return;

    const activeColId = activeTaskObj.columnId;

    // Detect if overId is a column or a task
    let overColId = overId;
    const overTaskObj = boardState.tasks[overId];

    if (overTaskObj) {
      overColId = overTaskObj.columnId;
    }

    // Move task between columns during drag
    if (activeColId !== overColId) {
      setBoardState((prev) => {
        const sourceCol = prev.columns[activeColId];
        const destCol = prev.columns[overColId];
        if (!sourceCol || !destCol) return prev;

        const sourceTaskIds = sourceCol.taskIds.filter((id) => id !== activeId);
        const destTaskIds = [...destCol.taskIds];

        // Find index to insert
        let targetIndex = destTaskIds.length;
        if (overTaskObj) {
          targetIndex = destTaskIds.indexOf(overId);
        }

        destTaskIds.splice(targetIndex, 0, activeId);

        // Create updated copy of the active task
        const updatedTask = {
          ...activeTaskObj,
          columnId: overColId,
        };

        return {
          ...prev,
          tasks: {
            ...prev.tasks,
            [activeId]: updatedTask,
          },
          columns: {
            ...prev.columns,
            [activeColId]: {
              ...sourceCol,
              taskIds: sourceTaskIds,
            },
            [overColId]: {
              ...destCol,
              taskIds: destTaskIds,
            },
          },
        };
      });
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTaskId(null);
    setActiveTask(null);

    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    const activeTaskObj = boardState.tasks[activeId];
    if (!activeTaskObj) return;

    const activeColId = activeTaskObj.columnId;

    let overColId = overId;
    const overTaskObj = boardState.tasks[overId];
    if (overTaskObj) {
      overColId = overTaskObj.columnId;
    }

    // Finalize within same column ordering
    if (activeColId === overColId) {
      const column = boardState.columns[activeColId];
      if (!column) return;

      const oldIndex = column.taskIds.indexOf(activeId);
      const newIndex = column.taskIds.indexOf(overId);

      if (oldIndex !== newIndex) {
        const newTaskIds = arrayMove(column.taskIds, oldIndex, newIndex);
        reorderTasks(activeColId, newTaskIds);
      }
    }
  };

  const renderListView = () => {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full mt-6">
        {boardState.columnOrder.map((colId) => {
          const column = boardState.columns[colId];
          if (!column) return null;

          const columnTasks = column.taskIds
            .map((id) => boardState.tasks[id])
            .filter((t): t is Task => !!t && matchesSearch(t) && matchesPriority(t) && matchesTag(t));

          return (
            <div key={column.id} className="flex flex-col gap-3">
              {/* Group Header */}
              <div className="flex items-center justify-between pb-2 border-b border-white/5">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${
                    column.id === 'done' ? 'bg-emerald-500' : column.id === 'in-progress' ? 'bg-amber-500' : 'bg-slate-500'
                  }`} />
                  <h3 className="font-display font-bold text-sm text-slate-200 tracking-wide">
                    {column.title}
                  </h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/5 text-slate-400">
                    {columnTasks.length}
                  </span>
                </div>
              </div>

              {/* Tasks List */}
              {columnTasks.length === 0 ? (
                <div className="text-center py-6 border border-dashed border-white/5 rounded-xl text-xs text-slate-500 bg-slate-900/10">
                  No tasks in this stage
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {columnTasks.map((task) => {
                    const subtasksCompleted = task.subtasks?.filter(st => st.isCompleted).length || 0;
                    const totalSubtasks = task.subtasks?.length || 0;
                    const isOverdue = task.dueDate && 
                                      new Date(task.dueDate).setHours(23, 59, 59, 999) < Date.now() && 
                                      task.columnId !== 'done';
                    
                    const getPriorityBadge = (p: Priority) => {
                      switch (p) {
                        case 'high':
                          return 'text-rose-400 bg-rose-500/10 border-rose-500/20';
                        case 'medium':
                          return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
                        case 'low':
                          return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
                        default:
                          return 'text-slate-400 bg-slate-500/10 border-slate-500/20';
                      }
                    };

                    return (
                      <div
                        key={task.id}
                        onClick={() => handleOpenEditTask(task)}
                        className="group flex flex-col gap-2 p-3.5 rounded-xl border border-white/5 bg-slate-900/20 hover:bg-slate-800/40 hover:border-brand-500/30 transition-all cursor-pointer"
                      >
                        {/* Title and actions */}
                        <div className="flex items-start justify-between gap-2 min-w-0">
                          <h4 className="font-semibold text-slate-200 font-display text-xs md:text-sm tracking-wide group-hover:text-purple-300 transition-colors truncate">
                            {task.title}
                          </h4>
                          
                          {/* Actions */}
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenEditTask(task);
                              }}
                              className="p-1 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-700/40"
                              title="Edit Task"
                            >
                              <Edit3 size={11} />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRequestDeleteTask(task.id);
                              }}
                              className="p-1 rounded text-slate-500 hover:text-rose-400 hover:bg-rose-500/10"
                              title="Delete Task"
                            >
                              <Trash2 size={11} />
                            </button>
                          </div>
                        </div>

                        {/* Description (if present) */}
                        {task.description && (
                          <p className="text-[11px] text-slate-400 font-sans line-clamp-1 truncate">
                            {task.description}
                          </p>
                        )}

                        {/* Details */}
                        {(task.priority || task.tags?.length || totalSubtasks > 0 || task.estimatedHours || task.dueDate) && (
                          <div className="flex flex-wrap items-center gap-2 mt-1 pt-1.5 border-t border-white/5 text-[10px] text-slate-500" onClick={(e) => e.stopPropagation()}>
                            {/* Priority */}
                            <span
                              className={`px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider rounded border shrink-0 ${getPriorityBadge(
                                task.priority
                              )}`}
                            >
                              {task.priority}
                            </span>

                            {/* Tags list */}
                            {task.tags && task.tags.length > 0 && (
                              <span className="px-1.5 py-0.5 rounded bg-purple-500/10 border border-purple-500/25 text-purple-300 text-[8px] font-bold uppercase shrink-0">
                                {task.tags[0]}
                              </span>
                            )}

                            {/* Subtasks Progress */}
                            {totalSubtasks > 0 && (
                              <span className="shrink-0 font-medium text-slate-400">
                                {subtasksCompleted}/{totalSubtasks} st
                              </span>
                            )}

                            {/* Due Date */}
                            {task.dueDate ? (
                              <span className={`shrink-0 font-medium ${isOverdue ? 'text-rose-400 font-semibold' : 'text-slate-500'}`}>
                                Due {new Date(task.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                              </span>
                            ) : (
                              <span className="shrink-0 text-slate-600">
                                {new Date(task.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  const activeFiltersCount = 
    (searchQuery ? 1 : 0) + 
    (priorityFilter !== 'all' ? 1 : 0) + 
    (selectedTag !== 'all' ? 1 : 0);

  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto px-4 py-8 animate-fade-in">
      
      {/* Board Top Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-6">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-brand-600/10 rounded-2xl border border-brand-500/20 text-brand-400 shadow-[0_0_20px_rgba(124,58,237,0.15)] animate-pulse-subtle">
            <Kanban size={28} className="stroke-[1.75]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl md:text-3xl font-display font-extrabold tracking-tight bg-gradient-to-r from-slate-100 via-slate-200 to-purple-300 bg-clip-text text-transparent">
                TaskFlow
              </h1>
            </div>
            <p className="text-xs text-slate-400 mt-1 font-sans">
              Premium SaaS Kanban workspace. Streamline your project workflow.
            </p>
          </div>
        </div>

        {/* Global Stats and Action */}
        <div className="flex items-center gap-2 self-end md:self-auto">
          {/* View Toggle */}
          <div className="flex items-center bg-slate-950/40 p-1 rounded-xl border border-white/5 mr-1">
            <button
              onClick={() => setViewMode('board')}
              className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all select-none ${
                viewMode === 'board'
                  ? 'bg-brand-600/20 text-brand-300 border border-brand-500/30'
                  : 'text-slate-400 hover:text-slate-200 border border-transparent'
              }`}
              title="Board View"
            >
              <LayoutGrid size={13} />
              <span>Board</span>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all select-none ${
                viewMode === 'list'
                  ? 'bg-brand-600/20 text-brand-300 border border-brand-500/30'
                  : 'text-slate-400 hover:text-slate-200 border border-transparent'
              }`}
              title="List View"
            >
              <List size={13} />
              <span>List</span>
            </button>
          </div>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold border transition-all duration-200 select-none
              ${showFilters
                ? 'bg-brand-500/20 border-brand-500/40 text-brand-300 shadow-[0_0_15px_rgba(124,58,237,0.2)]'
                : 'bg-white/5 border-white/5 text-slate-300 hover:bg-white/10 hover:border-white/10'
              }`}
            title="Toggle search and filters"
          >
            <Filter size={14} />
            <span>Filters</span>
            {activeFiltersCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-brand-500 text-white font-bold text-[9px] flex items-center justify-center animate-bounce-subtle shrink-0">
                {activeFiltersCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setShowStats(!showStats)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold border transition-all duration-200 select-none
              ${showStats
                ? 'bg-brand-500/20 border-brand-500/40 text-brand-300 shadow-[0_0_15px_rgba(124,58,237,0.2)]'
                : 'bg-white/5 border-white/5 text-slate-300 hover:bg-white/10 hover:border-white/10'
              }`}
            title="Toggle board statistics and analysis"
          >
            <BarChart3 size={14} />
            <span>{showStats ? 'Hide Analytics' : 'Show Analytics'}</span>
          </button>
          <span className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-white/5 border border-white/5 text-slate-300">
            {totalTasksCount} {totalTasksCount === 1 ? 'Task' : 'Tasks'} Total
          </span>
          <button
            onClick={() => setIsClearConfirmOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-rose-400 hover:text-rose-300 bg-rose-500/5 hover:bg-rose-500/10 border border-rose-500/10 hover:border-rose-500/20 transition-all duration-200"
            title="Clear entire board"
          >
            <Trash2 size={14} />
            <span>Clear Board</span>
          </button>
        </div>
      </div>

      {/* Analytics Dashboard */}
      <BoardStats boardState={boardState} isOpen={showStats} />

      {/* Filters Toolbar */}
      <div 
        className={`transition-all duration-350 ease-in-out overflow-hidden ${
          showFilters 
            ? 'max-h-[300px] opacity-100 mb-2 transform translate-y-0' 
            : 'max-h-0 opacity-0 mb-0 -translate-y-2 pointer-events-none'
        }`}
      >
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900/30 border border-white/5 shadow-glass backdrop-blur-md">
          {/* Search */}
          <div className="relative w-full md:max-w-xs shrink-0">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Search title, description, or tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-950/40 border border-white/5 text-slate-200 text-xs font-sans tracking-wide placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500/60 focus:bg-slate-950/80 transition-all duration-200"
            />
          </div>

          {/* Grouped Priority & Tags Filters */}
          <div className="flex flex-wrap items-center gap-4 md:gap-6 w-full md:w-auto">
            {/* Priority Filter */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 text-xs text-slate-400 font-semibold shrink-0">
                <Filter size={13} className="text-slate-500" />
                <span>Priority:</span>
              </div>
              <div className="flex items-center gap-1">
                {(['all', 'low', 'medium', 'high'] as const).map((p) => (
                  <button
                    key={p}
                    onClick={() => setPriorityFilter(p)}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all duration-200 shrink-0 select-none border
                      ${priorityFilter === p
                        ? 'bg-brand-600/25 border-brand-500/50 text-brand-300 shadow-[0_0_12px_rgba(124,58,237,0.15)]'
                        : 'bg-slate-900/40 border-white/5 text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                      }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            {/* Separator */}
            {allUniqueTags.length > 0 && (
              <div className="hidden sm:block w-px h-5 bg-white/10" />
            )}

            {/* Tag Filters */}
            {allUniqueTags.length > 0 && (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 text-xs text-slate-400 font-semibold shrink-0">
                  <Tag size={12} className="text-slate-500" />
                  <span>Tags:</span>
                </div>
                <div className="flex flex-wrap items-center gap-1">
                  <button
                    onClick={() => setSelectedTag('all')}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all duration-200 select-none border
                      ${selectedTag === 'all'
                        ? 'bg-brand-600/25 border-brand-500/50 text-brand-300 shadow-[0_0_12px_rgba(124,58,237,0.15)]'
                        : 'bg-slate-900/40 border-white/5 text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                      }`}
                  >
                    All
                  </button>
                  {allUniqueTags.map((tag) => (
                    <button
                      key={tag}
                      onClick={() => setSelectedTag(selectedTag === tag ? 'all' : tag)}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all duration-200 select-none border
                        ${selectedTag === tag
                          ? 'bg-purple-500/20 border-purple-500 text-purple-300 shadow-[0_0_12px_rgba(139,92,246,0.15)]'
                          : 'bg-slate-900/40 border-white/5 text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                        }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Board content (Grid / List view toggle) */}
      {viewMode === 'board' ? (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <div className="flex flex-col md:flex-row gap-6 items-start overflow-x-auto pb-6 -mx-4 px-4 w-[calc(100%+2rem)] scroll-smooth no-scrollbar">
            {boardState.columnOrder.map((colId) => {
              const column = boardState.columns[colId];
              if (!column) return null;

              // Map and filter cards in column
              const columnTasks = column.taskIds
                .map((id) => boardState.tasks[id])
                .filter((t): t is Task => !!t && matchesSearch(t) && matchesPriority(t) && matchesTag(t));

              return (
                <Column
                  key={column.id}
                  column={column}
                  tasks={columnTasks}
                  onAddTask={handleOpenAddTask}
                  onEditTask={handleOpenEditTask}
                  onDeleteTask={handleRequestDeleteTask}
                />
              );
            })}
          </div>

          {/* Drag Overlay: Renders a beautiful visual representative card during drag */}
          <DragOverlay adjustScale={false}>
            {activeTaskId && activeTask ? (
              <div className="w-[318px] transform rotate-[2deg] opacity-90 shadow-2xl pointer-events-none select-none">
                <Card
                  task={activeTask}
                  onEdit={() => {}}
                  onDelete={() => {}}
                  isDragging={false}
                />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      ) : (
        renderListView()
      )}

      {/* Task Creation & Edit Modal */}
      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        onSave={handleSaveTask}
        task={editingTask}
      />

      {/* Clear Board Confirmation Modal */}
      <ConfirmationModal
        isOpen={isClearConfirmOpen}
        onClose={() => setIsClearConfirmOpen(false)}
        onConfirm={clearBoard}
        title="Reset Kanban Board"
        message="Are you sure you want to clear the entire board? This action will permanently delete all tasks across all columns and reset the board state. This cannot be undone."
        confirmText="Clear Everything"
        cancelText="Keep Tasks"
        isDanger={true}
      />

      {/* Delete Single Task Confirmation Modal */}
      <ConfirmationModal
        isOpen={deletingTaskId !== null}
        onClose={() => setDeletingTaskId(null)}
        onConfirm={handleConfirmDeleteTask}
        title="Delete Task"
        message="Are you sure you want to delete this task? This action will permanently remove it from your workspace. This cannot be undone."
        confirmText="Delete Task"
        cancelText="Cancel"
        isDanger={true}
      />
    </div>
  );
};
