
export default function Input({
  label,
  icon: Icon,
  error,
  className = '',
  id,
  ...props
}) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && (
        <label htmlFor={inputId} className="block text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">
          {label}
        </label>
      )}
      <div className="relative group">
        {Icon && (
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
            <Icon className="w-5 h-5 text-gray-400 group-focus-within:text-primary-500 transition-colors" />
          </div>
        )}
        <input
          id={inputId}
          className={`
            w-full py-3 bg-gray-50 dark:bg-gray-800/50 border rounded-xl text-sm font-medium text-gray-900 dark:text-gray-100 placeholder:text-gray-400 transition-all duration-200
            focus:outline-none focus:ring-4 focus:ring-primary-500/10 focus:bg-white dark:focus:bg-gray-900
            ${Icon ? 'pl-11 pr-4' : 'px-4'}
            ${error 
              ? 'border-red-300 focus:border-red-500 dark:border-red-500/50' 
              : 'border-gray-200 dark:border-gray-700 focus:border-primary-500'
            }
          `}
          {...props}
        />
      </div>
      {error && (
        <p className="text-[10px] text-red-500 font-bold mt-1">{error}</p>
      )}
    </div>
  );
}
