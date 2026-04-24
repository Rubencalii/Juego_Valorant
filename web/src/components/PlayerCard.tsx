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
    <div className="relative z-10 bg-surface-container border border-off-white/20 clip-card group w-[480px] min-w-[480px] h-[650px] shadow-[0_0_50px_rgba(0,0,0,0.5)] transition-transform duration-500 hover:scale-[1.02]">
      {/* Decorative Corner Red Square */}
      <div className="absolute top-0 right-0 w-12 h-12 bg-valorant-red clip-card z-30"></div>
      
      {/* Background Image (Full Card) */}
      <div className="absolute inset-0 bg-surface-dim overflow-hidden">
        {imageUrl && (
          <div 
            className="absolute inset-0 bg-cover bg-top grayscale opacity-60 group-hover:opacity-100 group-hover:grayscale-0 transition-all duration-1000 transform scale-[2.2] origin-top"
            style={{ backgroundImage: `url(${imageUrl})` }}
          />
        )}
        {!imageUrl && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0f1923] z-0 overflow-hidden">
            {/* Cyber Silhouette Shape */}
            <div className="w-64 h-80 bg-valorant-red/10 clip-card relative opacity-40">
              <div className="absolute inset-0 border-2 border-valorant-red/20" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-8xl opacity-10">?</div>
            </div>
            <div className="mt-8 font-display text-sm tracking-[0.5em] text-[#ECE8E1]/20 uppercase font-black animate-pulse">
              Agent_Unknown
            </div>
            {/* Background geometric pattern */}
            <div className="absolute inset-0 opacity-[0.05] pointer-events-none" 
                 style={{ backgroundImage: 'radial-gradient(circle, #FF4655 1px, transparent 1px)', backgroundSize: '30px 30px' }} />
          </div>
        )}

        {/* Cinematic Overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent z-10" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-transparent to-black/40 z-10" />
      </div>

      {/* Content Overlay */}
      <div className="absolute inset-0 p-8 flex flex-col justify-end z-20">
        <div className="mb-4">
          <div className="flex items-center gap-3 mb-4">
             <div className="w-10 h-6 bg-off-white/20 border border-off-white/40 flex items-center justify-center text-[10px] font-black text-off-white">VCT</div>
             <span className="font-display font-black text-lg text-valorant-red bg-white/10 backdrop-blur-md px-4 py-1 uppercase border border-valorant-red/30 tracking-widest">{role}</span>
          </div>
          
          <h3 className="font-display text-6xl font-black text-off-white uppercase tracking-tighter italic leading-none drop-shadow-2xl">
            {nickname}
          </h3>
          {realName && (
            <p className="font-body text-base text-off-white/70 uppercase tracking-[0.3em] font-bold mt-2 border-l-4 border-valorant-red pl-4">
              {realName}
            </p>
          )}
        </div>
        
        <div className="flex justify-between items-center border-t border-off-white/20 pt-6 mt-4">
          <div className="flex flex-col">
            <span className="text-[10px] font-display text-off-white/40 uppercase tracking-widest mb-1">Performance Index</span>
            <span className="font-mono text-xl font-black tracking-widest text-[#02e600]">K/D {kd}</span>
          </div>
          <div className="text-right">
            <span className="text-[10px] font-display text-off-white/40 uppercase tracking-widest mb-1 block">Status</span>
            <span className={`font-display text-xl font-black tracking-widest ${isOnline ? 'text-[#02e600]' : 'text-off-white/20'}`}>
              {isOnline ? 'ONLINE' : 'OFFLINE'}
            </span>
          </div>
        </div>
      </div>

      {/* UI Elements Decoration */}
      <div className="absolute top-8 left-8 w-2 h-16 border-l border-off-white/20 opacity-50" />
      <div className="absolute top-8 left-8 w-16 h-2 border-t border-off-white/20 opacity-50" />
    </div>
  );
}


