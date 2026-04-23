import React, { useState } from 'react';
import { Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface SearchInputProps {
  onSearch: (value: string) => void;
  isLoading?: boolean;
}

export function SearchInput({ onSearch, isLoading }: SearchInputProps) {
  const [value, setValue] = useState('');

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && value.trim()) {
      onSearch(value.trim());
      setValue('');
    }
  };

  return (
    <section className="w-full max-w-2xl mx-auto my-12 relative">
      <div className="bg-surface-container-highest border border-off-white/20 p-[2px] self-center clip-input group hover:border-valorant-red transition-colors">
        <div className="bg-surface flex items-center px-4 py-3 clip-input relative overflow-hidden">
          
          <span className="font-body text-xs text-valorant-red mr-2 font-semibold">USER_SEARCH:/</span>
          
          <input 
             className="bg-transparent border-none focus:ring-0 text-off-white font-body text-sm w-full placeholder:text-off-white/30 focus:outline-none" 
             placeholder="Enter target ID..." 
             type="text"
             value={value}
             onChange={(e) => setValue(e.target.value)}
             onKeyDown={handleKeyDown}
             disabled={isLoading}
             spellCheck={false} // Regla importante de los requisitos (RF-14)
          />

          <AnimatePresence>
            {!value && !isLoading && (
              <motion.span 
                initial={{ opacity: 0 }}
                animate={{ opacity: [1, 0, 1] }} 
                transition={{ repeat: Infinity, duration: 0.8 }}
                className="absolute right-4 w-2 h-4 bg-valorant-red shrink-0" 
              />
            )}
            
            {isLoading && (
              <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="absolute right-4 shrink-0"
              >
                <div className="w-4 h-4 border-2 border-valorant-red border-t-transparent rounded-full animate-spin"/>
              </motion.div>
            )}
          </AnimatePresence>

        </div>
      </div>
    </section>
  );
}
