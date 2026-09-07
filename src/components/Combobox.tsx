import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, Check } from 'lucide-react';

interface ComboboxProps {
  options: string[];
  value?: string;
  onValueChange: (val: string) => void;
  placeholder?: string;
  className?: string;
  emptyMessage?: string;
}

export const Combobox: React.FC<ComboboxProps> = ({
  options = [],
  value = '',
  onValueChange,
  placeholder = 'Select...',
  className = '',
  emptyMessage = 'No option found.'
}) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState(value || '');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) {
      setSearch(value || '');
    }
  }, [value, open]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  const handleSelect = (val: string) => {
    setSearch(val);
    onValueChange(val);
    setOpen(false);
  };

  const filteredOptions = search
    ? options.filter((opt) => opt.toLowerCase().includes(search.toLowerCase()))
    : options;

  const isExactMatch = options.some((opt) => opt.toLowerCase() === (search || '').toLowerCase());

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      {/* Trigger button */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`h-7 text-xs w-full justify-between bg-gray-50 font-normal hover:bg-gray-100 flex items-center px-2 py-1 rounded border border-gray-200 transition-colors text-left ${
          !value ? 'text-gray-400' : 'text-gray-900'
        }`}
      >
        <span className="truncate flex-1">{value || placeholder}</span>
        <ChevronDown className="ml-1 h-3.5 w-3.5 shrink-0 opacity-50 text-gray-500" />
      </button>

      {/* Dropdown Popover */}
      {open && (
        <div className="absolute left-0 top-full mt-1 z-50 w-full min-w-[200px] max-w-[320px] bg-white rounded-md border border-gray-200 shadow-lg p-0 overflow-hidden text-xs">
          {/* Search Input */}
          <div className="p-1.5 border-b border-gray-100 bg-gray-50/50">
            <input
              ref={searchInputRef}
              type="text"
              placeholder={`Search ${placeholder}...`}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  if (filteredOptions.length > 0) {
                    handleSelect(filteredOptions[0]);
                  } else if (search.trim()) {
                    handleSelect(search.trim());
                  }
                } else if (e.key === 'Escape') {
                  setOpen(false);
                }
              }}
              className="h-7 w-full text-xs px-2 rounded border border-gray-200 bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          {/* Options List */}
          <div className="max-h-[200px] overflow-y-auto p-1 divide-y divide-gray-50">
            {filteredOptions.length === 0 ? (
              <div className="px-3 py-2 text-gray-400 text-[11px] text-center">{emptyMessage}</div>
            ) : (
              filteredOptions.map((opt) => {
                const isSelected = (value || '').toLowerCase() === opt.toLowerCase();
                return (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => handleSelect(opt)}
                    className={`w-full text-left px-2 py-1.5 rounded flex items-center text-xs transition-colors hover:bg-emerald-50 hover:text-emerald-900 ${
                      isSelected ? 'bg-emerald-50 text-emerald-800 font-semibold' : 'text-gray-700'
                    }`}
                  >
                    <Check
                      className={`mr-1.5 h-3.5 w-3.5 shrink-0 text-emerald-600 ${
                        isSelected ? 'opacity-100' : 'opacity-0'
                      }`}
                    />
                    <span className="truncate">{opt}</span>
                  </button>
                );
              })
            )}
          </div>

          {/* Custom entry: Use "search" */}
          {search && !isExactMatch && (
            <div
              className="border-t border-gray-100 px-2 py-1.5 text-xs text-emerald-700 bg-emerald-50 cursor-pointer hover:bg-emerald-100 transition-colors"
              onClick={() => handleSelect(search)}
            >
              Use "<span className="font-medium">{search}</span>"
            </div>
          )}
        </div>
      )}
    </div>
  );
};
