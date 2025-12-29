import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Code2 } from 'lucide-react';

interface LanguageSelectorProps {
  value: string;
  onChange: (value: string) => void;
}

const languages = [
  { value: 'javascript', label: 'JavaScript', icon: '🟨' },
  { value: 'typescript', label: 'TypeScript', icon: '🔷' },
  { value: 'python', label: 'Python', icon: '🐍' },
  { value: 'java', label: 'Java', icon: '☕' },
  { value: 'cpp', label: 'C++', icon: '⚡' },
];

export function LanguageSelector({ value, onChange }: LanguageSelectorProps) {
  const selectedLanguage = languages.find(lang => lang.value === value);
  
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-[180px] border-border bg-secondary text-secondary-foreground">
        <Code2 className="mr-2 h-4 w-4 text-primary" />
        <SelectValue placeholder="Select language">
          {selectedLanguage && (
            <span className="flex items-center gap-2">
              <span>{selectedLanguage.icon}</span>
              <span>{selectedLanguage.label}</span>
            </span>
          )}
        </SelectValue>
      </SelectTrigger>
      <SelectContent className="border-border bg-popover">
        {languages.map((lang) => (
          <SelectItem
            key={lang.value}
            value={lang.value}
            className="cursor-pointer hover:bg-muted"
          >
            <span className="flex items-center gap-2">
              <span>{lang.icon}</span>
              <span>{lang.label}</span>
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
