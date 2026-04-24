import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AutocompleteDropdown } from './AutocompleteDropdown';

interface SearchInputProps {
  onSearch: (value: string) => void;
  isLoading?: boolean;
}

export function SearchInput({ onSearch, isLoading }: SearchInputProps) {
  const [value, setValue] = useState('');
  const [showAutocomplete, setShowAutocomplete] = useState(false);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && value.trim()) {
      onSearch(value.trim());
      setValue('');
      setShowAutocomplete(false);
    }
    if (e.key === 'Escape') {
      setShowAutocomplete(false);
    }
  };

  const handleSelect = (player: { nickname: string }) => {
    onSearch(player.nickname);
    setValue('');
    setShowAutocomplete(false);
  };

  return (
    <section className="w-full max-w-2xl mx-auto my-8 relative">
      <div className="bg-[#2c3641] border border-[#ECE8E1]/20 p-[2px] clip-input group hover:border-[#FF4655] transition-colors">
        <div className="bg-[#0a141e] flex items-center px-4 py-3 clip-input relative overflow-hidden">

          <span className="font-body text-xs text-[#FF4655] mr-2 font-semibold shrink-0">USER_SEARCH:/</span>

          <input
            className="bg-transparent border-none focus:ring-0 text-[#ECE8E1] font-body text-sm w-full placeholder:text-[#ECE8E1]/30 focus:outline-none"
            placeholder="Enter target ID..."
            type="text"
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              setShowAutocomplete(e.target.value.length >= 1);
            }}
            onKeyDown={handleKeyDown}
            onFocus={() => value.length >= 1 && setShowAutocomplete(true)}
            onBlur={() => setTimeout(() => setShowAutocomplete(false), 200)}
            disabled={isLoading}
            spellCheck={false}
            autoCorrect="off"
            autoCapitalize="off"
            autoComplete="off"
          />

          <AnimatePresence>
            {!value && !isLoading && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: [1, 0, 1] }}
                transition={{ repeat: Infinity, duration: 0.8 }}
                className="absolute right-4 w-2 h-4 bg-[#FF4655] shrink-0"
              />
            )}

            {isLoading && (
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="absolute right-4 shrink-0"
              >
                <div className="w-4 h-4 border-2 border-[#FF4655] border-t-transparent rounded-full animate-spin" />
              </motion.div>
            )}
          </AnimatePresence>

        </div>
      </div>

      {/* Autocomplete dropdown */}
      <AutocompleteDropdown
        query={value}
        onSelect={handleSelect}
        isVisible={showAutocomplete && !isLoading}
      />
    </section>
  );
}
