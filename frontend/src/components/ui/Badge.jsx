import React from 'react';

const variants = {
  primary: "bg-primary-50 text-primary-700 border-primary-100 dark:bg-primary-900/30 dark:text-primary-400 dark:border-primary-800",
  success: "bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800",
  warning: "bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800",
  danger: "bg-red-50 text-red-700 border-red-100 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800",
  dark: "bg-gray-900 text-gray-100 border-gray-700 dark:bg-gray-100 dark:text-gray-900 dark:border-gray-300",
  light: "bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700"
};

export default function Badge({ 
  children, 
  variant = 'primary', 
  icon: Icon,
  className = '' 
}) {
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] sm:text-xs font-bold uppercase tracking-widest border ${variants[variant]} ${className}`}>
      {Icon && <Icon className="w-3 h-3 sm:w-3.5 sm:h-3.5" />}
      {children}
    </span>
  );
}
