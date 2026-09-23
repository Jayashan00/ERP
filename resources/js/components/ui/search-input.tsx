import { Search, X } from "lucide-react";
import { Input } from "./input";
import { Button } from "./button";
import { useTranslation } from 'react-i18next';

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  onSearch: (clearSearch?: boolean) => void;
  placeholder?: string;
  className?: string;
}

export function SearchInput({
  value,
  onChange,
  onSearch,
  placeholder,
  className = "sm:max-w-xs"
}: SearchInputProps) {
  const { t } = useTranslation();
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      onSearch();
    }
  };

  return (
    <div className={`flex items-center gap-2 w-full min-w-0 sm:w-full sm:flex-1 ${className}`}>
      <div className="relative flex-1 min-w-0">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={placeholder || t('Search...')}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyPress={handleKeyPress}
          className={`pl-10 w-full ${value ? 'pr-10' : ''}`}
        />
        {value && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              onChange('');
              onSearch(true);
            }}
            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
      <Button onClick={() => onSearch()} size="sm" className="shrink-0 px-3 sm:px-3">
        <Search className="h-4 w-4 sm:hidden" />
        <span className="hidden sm:inline">{t('Search')}</span>
      </Button>
    </div>
  );
}