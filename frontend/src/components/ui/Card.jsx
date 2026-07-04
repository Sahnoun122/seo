
export function Card({ children, className = '', hoverable = false }) {
  return (
    <div className={`
      bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 
      transition-all duration-300 shadow-sm
      ${hoverable ? 'hover:-translate-y-1 hover:shadow-xl hover:shadow-primary-500/10' : ''}
      ${className}
    `}>
      {children}
    </div>
  );
}

export function CardHeader({ children, className = '', icon: Icon, title }) {
  if (title) {
    return (
      <div className={`px-6 py-5 border-b border-gray-100 dark:border-gray-800 flex items-center gap-3 ${className}`}>
        {Icon && (
          <div className="bg-primary-50 dark:bg-primary-900/30 p-2 rounded-xl text-primary-600 dark:text-primary-400">
            <Icon className="w-5 h-5" />
          </div>
        )}
        <h3 className="text-base font-bold text-gray-900 dark:text-white">{title}</h3>
        {children && <div className="ml-auto">{children}</div>}
      </div>
    );
  }
  return <div className={`px-6 py-5 border-b border-gray-100 dark:border-gray-800 ${className}`}>{children}</div>;
}

export function CardContent({ children, className = '' }) {
  return (
    <div className={`p-6 ${className}`}>
      {children}
    </div>
  );
}

export function CardFooter({ children, className = '' }) {
  return (
    <div className={`px-6 py-4 bg-gray-50/50 dark:bg-gray-800/30 border-t border-gray-100 dark:border-gray-800 rounded-b-2xl ${className}`}>
      {children}
    </div>
  );
}
