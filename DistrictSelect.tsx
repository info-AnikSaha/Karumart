import React from 'react';
import { 
  Select, 
  SelectContent, 
  SelectGroup, 
  SelectItem, 
  SelectLabel, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { DIVISIONS_AND_DISTRICTS, ALL_DISTRICTS, District } from '@/lib/districts';
import { useLanguage } from '@/contexts/LanguageContext';
import { MapPin } from 'lucide-react';

interface DistrictSelectProps {
  value?: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  includeAll?: boolean;
  allLabel?: string;
  className?: string;
  showIcon?: boolean;
  disabled?: boolean;
}

export const DistrictSelect: React.FC<DistrictSelectProps> = ({
  value,
  onValueChange,
  placeholder,
  includeAll = false,
  allLabel,
  className = '',
  showIcon = true,
  disabled = false
}) => {
  const { language } = useLanguage();
  const isBn = language === 'bn';

  const defaultPlaceholder = isBn ? 'জেলা নির্বাচন করুন' : 'Select District';
  const defaultAllLabel = isBn ? 'সকল জেলা (All Districts)' : 'All Districts';

  return (
    <Select value={value || (includeAll ? 'all' : undefined)} onValueChange={onValueChange} disabled={disabled}>
      <SelectTrigger className={`w-full bg-white border-gray-200 text-left font-normal ${className}`}>
        <div className="flex items-center gap-2 truncate">
          {showIcon && <MapPin className="w-3.5 h-3.5 text-red-500 shrink-0" />}
          <SelectValue placeholder={placeholder || defaultPlaceholder} />
        </div>
      </SelectTrigger>
      <SelectContent className="max-h-[320px]">
        {includeAll && (
          <SelectItem value="all" className="font-semibold text-green-700">
            {allLabel || defaultAllLabel}
          </SelectItem>
        )}

        {DIVISIONS_AND_DISTRICTS.map((division) => (
          <SelectGroup key={division.id}>
            <SelectLabel className="font-bold text-xs uppercase tracking-wider text-green-800 bg-green-50/70 px-2 py-1 my-1 rounded">
              {isBn ? `বিভাগ: ${division.nameBn}` : `Division: ${division.nameEn}`}
            </SelectLabel>
            {division.districts.map((district) => (
              <SelectItem key={district.id} value={district.id} className="py-1.5 pl-4">
                <span className="font-medium text-gray-900">{district.nameBn}</span>
                <span className="text-gray-400 text-xs ml-1.5">({district.nameEn})</span>
              </SelectItem>
            ))}
          </SelectGroup>
        ))}
      </SelectContent>
    </Select>
  );
};
