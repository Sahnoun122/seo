import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';

const languages = [
  { code: 'en', name: 'English' },
  { code: 'fr', name: 'Français' },
  { code: 'es', name: 'Español' },
  { code: 'it', name: 'Italiano' },
  { code: 'zh', name: '中文' },
  { code: 'ar', name: 'العربية' }
];

export default function LanguageSwitcher({ direction = 'down' }) {
  const { i18n } = useTranslation();

  return (
    <div className="relative group">
      <div className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-2 sm:py-2.5 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-all cursor-pointer text-sm font-medium">
        <Globe className="w-4 h-4 sm:w-4.5 sm:h-4.5 shrink-0" />
        <span className="hidden sm:inline uppercase text-[11px] font-bold tracking-widest">{i18n.language.split('-')[0]}</span>
      </div>

      {/* Dropdown menu */}
      <div className={`absolute ${direction === 'up' ? 'left-0 bottom-full mb-2' : 'right-0 top-full mt-2'} w-32 bg-white dark:bg-gray-900 rounded-xl shadow-lg border border-gray-100 dark:border-gray-800 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50`}>
        <div className="py-2">
          {languages.map((lng) => (
            <button
              key={lng.code}
              onClick={() => i18n.changeLanguage(lng.code)}
              className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                i18n.language.startsWith(lng.code)
                  ? 'text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20 font-bold'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
              }`}
            >
              {lng.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
