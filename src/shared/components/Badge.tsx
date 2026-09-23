import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function Badge({
  variant = 'default',
  className,
  children
}: {
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'cyan';
  className?: string;
  children: React.ReactNode;
}) {
  const styles = {
    default: 'bg-slate-800 text-slate-300 border-slate-700',
    success: 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40 shadow-xs shadow-emerald-950',
    warning: 'bg-amber-950/80 text-amber-300 border-amber-500/40 shadow-xs shadow-amber-950',
    danger: 'bg-rose-950/80 text-rose-300 border-rose-500/40 shadow-xs shadow-rose-950',
    info: 'bg-sky-950/80 text-sky-300 border-sky-500/40 shadow-xs shadow-sky-950',
    cyan: 'bg-cyan-950/80 text-cyan-300 border-cyan-500/40 shadow-xs shadow-cyan-950'
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border',
        styles[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
