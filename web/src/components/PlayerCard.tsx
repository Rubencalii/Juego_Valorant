import React from 'react';

interface PlayerCardProps {
  nickname: string;
  realName?: string;
  role: string;
  kd: string;
  imageUrl?: string;
  isOnline?: boolean;
}

export function PlayerCard({ nickname, realName, role, kd, imageUrl, isOnline }: PlayerCardProps) {
  return (
    <div className="relative z-10 bg-surface-container border border-off-white/10 p-2 clip-card group w-full max-w-sm">
      {/* Decorative Corner Red Square */}
      <div className="absolute top-0 right-0 w-8 h-8 bg-valorant-red clip-card z-20"></div>
      
      {/* Image Area */}
      <div className="relative h-64 bg-surface-dim overflow-hidden clip-card mb-4 group-hover:bg-surface-container-highest transition-colors">
        {imageUrl && (
          <div 
            className="absolute inset-0 bg-cover bg-center grayscale mix-blend-luminosity opacity-80 group-hover:opacity-100 group-hover:grayscale-0 transition-all duration-300"
            style={{ backgroundImage: `url(${imageUrl})` }}
          />
        )}
        {!imageUrl && (
          <div className="absolute inset-0 flex items-center justify-center text-off-white/20 font-display">
            NO_IMAGE_DATA
          </div>
        )}
        <div className="absolute bottom-4 left-4 flex items-center gap-2">
          {/* Placeholder for flag */}
          <div className="w-6 h-4 bg-off-white/20 border border-off-white/50" />
          <span className="font-display font-bold text-sm text-off-white bg-black/50 px-2 py-1 uppercase">{role}</span>
        </div>
      </div>
      
      {/* Information Area */}
      <div className="px-4 pb-4">
        <h3 className="font-display text-2xl font-bold text-off-white mb-1 uppercase tracking-tight">{nickname}</h3>
        {realName && <p className="font-body text-xs text-off-white/50 mb-2 uppercase">{realName}</p>}
        
        <div className="flex justify-between items-center text-secondary border-t border-off-white/10 pt-3 mt-2">
          <span className="font-body text-xs font-semibold tracking-widest text-off-white/80">K/D: {kd}</span>
          <span className={`font-body text-xs font-bold tracking-widest ${isOnline ? 'text-green-500' : 'text-off-white/50'}`}>
            {isOnline ? 'ONLINE' : 'OFFLINE'}
          </span>
        </div>
      </div>
    </div>
  );
}
