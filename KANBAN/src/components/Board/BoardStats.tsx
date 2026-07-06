import React, { useEffect, useState } from 'react';
import { BarChart3, AlertCircle, CheckCircle2, CircleDot, Flame, TrendingUp, Inbox } from 'lucide-react';
import type { BoardState } from '../../types';

interface BoardStatsProps {
  boardState: BoardState;
  isOpen: boolean;
}

// Performant requestAnimationFrame ticker component
const AnimatedValue: React.FC<{ value: number; duration?: number; suffix?: string; prefix?: string }> = ({
  value,
  duration = 800,
  suffix = '',
  prefix = ''
}) => {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    let startTimestamp: number | null = null;
    let animationFrameId: number;

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const elapsed = timestamp - startTimestamp;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function - easeOutQuad
      const easedProgress = progress * (2 - progress);
      
      setCurrent(Math.floor(easedProgress * value));

      if (progress < 1) {
        animationFrameId = window.requestAnimationFrame(step);
      } else {
        setCurrent(value);
      }
    };

    animationFrameId = window.requestAnimationFrame(step);
    return () => window.cancelAnimationFrame(animationFrameId);
  }, [value, duration]);

  return <>{prefix}{current}{suffix}</>;
};

export const BoardStats: React.FC<BoardStatsProps> = ({ boardState, isOpen }) => {
  const [shouldRender, setShouldRender] = useState(isOpen);
  const [animationClass, setAnimationClass] = useState('opacity-0 -translate-y-4 max-h-0');
  const [animateBars, setAnimateBars] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      // Wait for mount, then slide down and trigger progress bars
      const timer1 = setTimeout(() => {
        setAnimationClass('opacity-100 translate-y-0 max-h-[500px]');
      }, 10);
      const timer2 = setTimeout(() => {
        setAnimateBars(true);
      }, 150);
      return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
      };
    } else {
      setAnimateBars(false);
      setAnimationClass('opacity-0 -translate-y-4 max-h-0');
      const timer = setTimeout(() => {
        setShouldRender(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!shouldRender) return null;

  // Calculations
  const tasks = Object.values(boardState.tasks);
  const totalTasks = tasks.length;
  
  const todoCount = boardState.columns['todo']?.taskIds.length || 0;
  const inProgressCount = boardState.columns['in-progress']?.taskIds.length || 0;
  const doneCount = boardState.columns['done']?.taskIds.length || 0;

  const highPriority = tasks.filter(t => t.priority === 'high').length;
  const mediumPriority = tasks.filter(t => t.priority === 'medium').length;
  const lowPriority = tasks.filter(t => t.priority === 'low').length;

  const completionRate = totalTasks > 0 ? Math.round((doneCount / totalTasks) * 100) : 0;
  const activeRate = totalTasks > 0 ? Math.round((inProgressCount / totalTasks) * 100) : 0;

  // Dynamic recommendations
  const getBottleneckMessage = () => {
    if (totalTasks === 0) {
      return {
        text: 'Board is currently empty. Create a task to start tracking metrics!',
        color: 'border-slate-500/10 bg-slate-500/5 text-slate-400',
        icon: <Inbox size={16} className="text-slate-400" />
      };
    }
    if (inProgressCount > 4) {
      return {
        text: 'Work In Progress (WIP) limit exceeded. Focus on finishing active tasks first!',
        color: 'border-amber-500/20 bg-amber-500/5 text-amber-400 shadow-[inset_0_0_12px_rgba(245,158,11,0.05)]',
        icon: <Flame size={16} className="text-amber-400 animate-bounce" />
      };
    }
    if (todoCount > totalTasks * 0.6) {
      return {
        text: 'Backlog is accumulating. Try prioritizing backlog tasks and assigning them to sprints.',
        color: 'border-indigo-500/20 bg-indigo-500/5 text-indigo-400',
        icon: <CircleDot size={16} className="text-indigo-400" />
      };
    }
    if (doneCount === totalTasks && totalTasks > 0) {
      return {
        text: 'Incredible work! All tasks are completed. Ready for the next phase.',
        color: 'border-emerald-500/20 bg-emerald-500/5 text-emerald-400 shadow-[inset_0_0_12px_rgba(16,185,129,0.05)]',
        icon: <CheckCircle2 size={16} className="text-emerald-400" />
      };
    }
    return {
      text: 'Flow distribution is stable. Workload is balanced across columns.',
      color: 'border-brand-500/20 bg-brand-500/5 text-brand-400 shadow-[inset_0_0_12px_rgba(124,58,237,0.05)]',
      icon: <TrendingUp size={16} className="text-brand-400" />
    };
  };

  const bottleneck = getBottleneckMessage();

  // Circular progress stroke calculation
  const radius = 33;
  const circumference = 2 * Math.PI * radius;
  // Animate offset: start fully hidden (circumference), then draw to completionRate
  const currentRate = animateBars ? completionRate : 0;
  const strokeDashoffset = circumference - (currentRate / 100) * circumference;

  return (
    <div
      className={`glass-panel rounded-2xl border border-white/5 p-5 shadow-glass transition-all duration-300 overflow-hidden ${animationClass}`}
    >
      <div className="flex items-center gap-2 mb-4 border-b border-white/5 pb-3">
        <BarChart3 size={18} className="text-brand-400 animate-pulse" />
        <h2 className="font-display font-bold text-slate-100 text-sm tracking-wide">
          Board Productivity Analytics
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        
        {/* Metric 1: Circular Progress Gauge */}
        <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-950/40 border border-white/5 hover:border-brand-500/20 transition-all duration-300 group">
          <div className="relative flex items-center justify-center shrink-0">
            <svg className="w-20 h-20 transform -rotate-90">
              {/* Define dynamic gradient */}
              <defs>
                <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#8b5cf6" />
                  <stop offset="100%" stopColor="#ec4899" />
                </linearGradient>
              </defs>
              {/* Background circle */}
              <circle
                cx="40"
                cy="40"
                r={radius}
                className="stroke-slate-800"
                strokeWidth="5.5"
                fill="transparent"
              />
              {/* Progress circle */}
              <circle
                cx="40"
                cy="40"
                r={radius}
                stroke="url(#progressGradient)"
                strokeWidth="5.5"
                fill="transparent"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                style={{
                  transition: 'stroke-dashoffset 1.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
                }}
                className="drop-shadow-[0_0_6px_rgba(139,92,246,0.3)] group-hover:drop-shadow-[0_0_10px_rgba(236,72,153,0.5)] transition-all"
              />
            </svg>
            <span className="absolute text-sm font-display font-extrabold text-slate-200">
              <AnimatedValue value={completionRate} suffix="%" />
            </span>
          </div>
          <div>
            <div className="text-xs text-slate-400 font-semibold mb-0.5">Tasks Completed</div>
            <div className="text-lg font-display font-bold text-slate-100 flex items-baseline gap-1">
              <span>{doneCount}</span>
              <span className="text-xs text-slate-500 font-normal">/ {totalTasks}</span>
            </div>
            <div className="text-[10px] text-slate-500 group-hover:text-brand-400 transition-colors">Total accomplishments</div>
          </div>
        </div>

        {/* Metric 2: Column Workload Progress */}
        <div className="flex flex-col gap-2.5 p-4 rounded-xl bg-slate-950/40 border border-white/5 hover:border-brand-500/20 transition-all duration-300">
          <div className="text-xs font-semibold text-slate-400 flex justify-between">
            <span>Workload Distribution</span>
            <span className="text-amber-400 font-mono"><AnimatedValue value={activeRate} suffix="% Active" /></span>
          </div>
          
          <div className="flex flex-col gap-2 mt-0.5">
            {/* To Do Bar */}
            <div className="flex flex-col gap-1">
              <div className="flex justify-between text-[10px] text-slate-400 font-medium">
                <span>To Do</span>
                <span>{todoCount} ({totalTasks > 0 ? Math.round((todoCount / totalTasks) * 100) : 0}%)</span>
              </div>
              <div className="h-2 w-full bg-slate-800/80 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-[1000ms] cubic-bezier(0.34, 1.56, 0.64, 1) shimmer-bar"
                  style={{ width: `${animateBars && totalTasks > 0 ? (todoCount / totalTasks) * 100 : 0}%` }}
                />
              </div>
            </div>

            {/* In Progress Bar */}
            <div className="flex flex-col gap-1">
              <div className="flex justify-between text-[10px] text-slate-400 font-medium">
                <span>In Progress</span>
                <span>{inProgressCount} ({totalTasks > 0 ? Math.round((inProgressCount / totalTasks) * 100) : 0}%)</span>
              </div>
              <div className="h-2 w-full bg-slate-800/80 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full transition-all duration-[1000ms] cubic-bezier(0.34, 1.56, 0.64, 1) shimmer-bar"
                  style={{ width: `${animateBars && totalTasks > 0 ? (inProgressCount / totalTasks) * 100 : 0}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Metric 3: Priorities Breakdown */}
        <div className="flex flex-col gap-3 p-4 rounded-xl bg-slate-950/40 border border-white/5 hover:border-brand-500/20 transition-all duration-300">
          <span className="text-xs font-semibold text-slate-400">Tasks Priority Index</span>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="flex flex-col py-1.5 rounded-lg bg-rose-500/5 border border-rose-500/10 hover:bg-rose-500/10 hover:scale-105 transition-all duration-200">
              <span className="text-[10px] font-bold text-rose-400 uppercase tracking-wider">High</span>
              <span className="text-sm font-bold text-rose-300 mt-0.5">
                <AnimatedValue value={highPriority} />
              </span>
            </div>
            <div className="flex flex-col py-1.5 rounded-lg bg-amber-500/5 border border-amber-500/10 hover:bg-amber-500/10 hover:scale-105 transition-all duration-200">
              <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">Med</span>
              <span className="text-sm font-bold text-amber-300 mt-0.5">
                <AnimatedValue value={mediumPriority} />
              </span>
            </div>
            <div className="flex flex-col py-1.5 rounded-lg bg-emerald-500/5 border border-emerald-500/10 hover:bg-emerald-500/10 hover:scale-105 transition-all duration-200">
              <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">Low</span>
              <span className="text-sm font-bold text-emerald-300 mt-0.5">
                <AnimatedValue value={lowPriority} />
              </span>
            </div>
          </div>
        </div>

        {/* Metric 4: Recommendations Card */}
        <div className={`flex items-start gap-3 p-4 rounded-xl border transition-all duration-300 hover:scale-[1.02] ${bottleneck.color} shadow-sm animate-pulse-subtle`}>
          <div className="shrink-0 mt-0.5">{bottleneck.icon}</div>
          <div className="flex flex-col gap-0.5">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1">
              <AlertCircle size={10} className="animate-spin-slow" />
              <span>Smart Advice</span>
            </div>
            <p className="text-[11px] leading-relaxed font-sans mt-0.5 opacity-90">
              {bottleneck.text}
            </p>
          </div>
        </div>

      </div>
    </div>
  );
};
