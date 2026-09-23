import React from 'react';
import { cn } from './Badge';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'xs' | 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  className,
  children,
  disabled,
  ...props
}) => {
  const base = 'inline-flex items-center justify-center font-medium transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 disabled:pointer-events-none rounded-lg cursor-pointer';

  const variants = {
    primary: 'bg-blue-600 hover:bg-blue-500 text-white focus:ring-blue-400 shadow-md shadow-blue-900/30 border border-blue-500/50',
    secondary: 'bg-slate-800 hover:bg-slate-700 text-white focus:ring-slate-600 shadow-sm border border-slate-700',
    outline: 'border border-slate-700 hover:bg-slate-800 text-slate-200 focus:ring-slate-500 bg-slate-900/70',
    ghost: 'hover:bg-slate-800 text-slate-300 focus:ring-slate-600',
    danger: 'bg-rose-600 hover:bg-rose-500 text-white focus:ring-rose-400 shadow-md shadow-rose-950 border border-rose-500/50'
  };

  const sizes = {
    xs: 'text-xs px-2 py-1 gap-1',
    sm: 'text-xs px-2.5 py-1.5 gap-1.5',
    md: 'text-sm px-3.5 py-2 gap-2',
    lg: 'text-sm px-4 py-2.5 gap-2.5'
  };

  return (
    <button
      className={cn(base, variants[variant], sizes[size], className)}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && (
        <svg className="animate-spin -ml-0.5 mr-1.5 h-3.5 w-3.5 text-current" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
        </svg>
      )}
      {children}
    </button>
  );
};
