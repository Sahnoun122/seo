import React from 'react';
import { Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

const baseStyles = "inline-flex items-center justify-center gap-2 font-bold rounded-xl transition-all duration-200 active:scale-95 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed disabled:active:scale-100";

const variants = {
  primary: "bg-gradient-to-br from-primary-500 to-primary-700 text-white shadow-md hover:shadow-lg hover:shadow-primary-500/30",
  secondary: "bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700",
  ghost: "text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800",
  danger: "bg-red-500 text-white shadow-sm hover:bg-red-600 hover:shadow-red-500/20",
  outline: "border-2 border-primary-500 text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20"
};

const sizes = {
  sm: "px-3 py-1.5 text-xs",
  md: "px-4 py-2 text-sm",
  lg: "px-6 py-3 text-base"
};

export default function Button({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  isLoading = false, 
  icon: Icon,
  className = '', 
  ...props 
}) {
  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={isLoading || props.disabled}
      {...props}
    >
      {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
      {!isLoading && Icon && <Icon className="w-4 h-4" />}
      {children}
    </button>
  );
}
