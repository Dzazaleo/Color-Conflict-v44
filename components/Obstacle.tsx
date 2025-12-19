
import React, { useMemo, forwardRef, memo } from 'react';
import { ObstacleRow, ColorType, ObstacleType, PowerUpType, ObstacleItem } from '../types';
import { BG_COLOR_CLASS_MAP } from '../constants';
import { getGlitchText } from '../utils/gameLogic';
import clsx from 'clsx';
import { Zap, Waves, CloudLightning, Shuffle, MapPin, Cone, TriangleAlert, Flame, Binary, Droplet, Tag, Infinity, Lightbulb } from 'lucide-react';

interface ObstacleProps {
  obstacle: ObstacleRow;
  activeEffect?: PowerUpType;
  wildEffects?: PowerUpType[];
  visualFX?: boolean;
  isWarpGhost?: boolean; 
  showWarpGuidance?: boolean; 
  shouldHighlightGuided?: boolean; 
  zIndex?: number;
}

const CRATE_STYLE_MAP: Record<PowerUpType, { 
    Icon: React.ElementType, 
    colorClass: string, 
    borderClass: string, 
    bgClass: string, 
    label: string, 
    pingColor: string, 
    isWild: boolean 
}> = {
    [PowerUpType.SPEED]: { Icon: Zap, colorClass: "text-yellow-400", borderClass: "border-yellow-500/50", bgClass: "bg-yellow-900/40", label: "SPEED", pingColor: "bg-yellow-500", isWild: false },
    [PowerUpType.DRUNK]: { Icon: Waves, colorClass: "text-purple-400", borderClass: "border-purple-500/50", bgClass: "bg-purple-900/40", label: "DRUNK", pingColor: "bg-purple-500", isWild: false },
    [PowerUpType.FOG]: { Icon: CloudLightning, colorClass: "text-slate-400", borderClass: "border-slate-500/50", bgClass: "bg-slate-800/60", label: "STORM", pingColor: "bg-slate-400", isWild: false },
    [PowerUpType.DYSLEXIA]: { Icon: Shuffle, colorClass: "text-orange-400", borderClass: "border-orange-500/50", bgClass: "bg-orange-900/40", label: "SWAP", pingColor: "bg-orange-500", isWild: false },
    [PowerUpType.GPS]: { Icon: MapPin, colorClass: "text-teal-400", borderClass: "border-teal-500/50", bgClass: "bg-teal-900/40", label: "GPS", pingColor: "bg-teal-500", isWild: false },
    [PowerUpType.BLOCKER]: { Icon: Cone, colorClass: "text-amber-500", borderClass: "border-amber-500/50", bgClass: "bg-amber-900/40", label: "BLOCK", pingColor: "bg-amber-500", isWild: false },
    [PowerUpType.WILD]: { Icon: Flame, colorClass: "text-white", borderClass: "border-white/80", bgClass: "bg-white/10", label: "WILD", pingColor: "bg-white", isWild: true },
    [PowerUpType.GLITCH]: { Icon: Binary, colorClass: "text-lime-400", borderClass: "border-lime-500/50", bgClass: "bg-lime-900/40", label: "GLITCH", pingColor: "bg-lime-500", isWild: false },
    [PowerUpType.BLEACH]: { Icon: Droplet, colorClass: "text-red-400", borderClass: "border-red-500/50", bgClass: "bg-red-900/40", label: "BLEACH", pingColor: "bg-red-500", isWild: false },
    [PowerUpType.ALIAS]: { Icon: Tag, colorClass: "text-indigo-400", borderClass: "border-indigo-500/50", bgClass: "bg-indigo-900/40", label: "ALIAS", pingColor: "bg-indigo-500", isWild: false },
    [PowerUpType.WARP]: { Icon: Infinity, colorClass: "text-fuchsia-400", borderClass: "border-fuchsia-500/50", bgClass: "bg-fuchsia-900/40", label: "WARP", pingColor: "bg-fuchsia-500", isWild: false },
    [PowerUpType.NONE]: { Icon: Zap, colorClass: "text-gray-400", borderClass: "border-gray-500/50", bgClass: "bg-gray-900/40", label: "NONE", pingColor: "bg-gray-500", isWild: false },
};

export const getCrateStyles = (effect: PowerUpType, visualFX: boolean = true) => {
    const base = CRATE_STYLE_MAP[effect] || CRATE_STYLE_MAP[PowerUpType.SPEED];
    let shadowClass = "shadow-sm";
    if (visualFX) {
        switch (effect) {
            case PowerUpType.SPEED: shadowClass = "shadow-[0_0_20px_rgba(234,179,8,0.4)]"; break;
            case PowerUpType.DRUNK: shadowClass = "shadow-[0_0_20px_rgba(168,85,247,0.4)]"; break;
            case PowerUpType.FOG: shadowClass = "shadow-[0_0_20px_rgba(148,163,184,0.4)]"; break;
            case PowerUpType.DYSLEXIA: shadowClass = "shadow-[0_0_20px_rgba(249,115,22,0.4)]"; break;
            case PowerUpType.GPS: shadowClass = "shadow-[0_0_20px_rgba(45,212,191,0.4)]"; break;
            case PowerUpType.BLOCKER: shadowClass = "shadow-[0_0_20px_rgba(245,158,11,0.4)]"; break;
            case PowerUpType.WILD: shadowClass = "shadow-[0_0_30px_rgba(255,255,255,0.6)]"; break;
            case PowerUpType.GLITCH: shadowClass = "shadow-[0_0_20px_rgba(132,204,22,0.4)]"; break;
            case PowerUpType.BLEACH: shadowClass = "shadow-[0_0_20px_rgba(248,113,113,0.4)]"; break;
            case PowerUpType.ALIAS: shadowClass = "shadow-[0_0_20px_rgba(129,140,248,0.4)]"; break;
            case PowerUpType.WARP: shadowClass = "shadow-[0_0_20px_rgba(192,38,233,0.4)]"; break;
            default: shadowClass = "shadow-sm";
        }
    }
    return { ...base, shadowClass };
};

export const CrateVisual: React.FC<{ effect: PowerUpType, className?: string, visualFX?: boolean }> = ({ effect, className, visualFX = true }) => {
    const { Icon, colorClass, borderClass, bgClass, shadowClass, label, pingColor, isWild } = getCrateStyles(effect, visualFX);
    return (
        <div className={clsx(
            "w-24 h-24 rounded-xl border-2 flex flex-col items-center justify-center relative",
            visualFX && "animate-pulse", 
            bgClass,
            borderClass,
            shadowClass,
            className
        )}
        style={isWild && visualFX ? { animation: 'rainbow-pulse 2s linear infinite' } : {}}
        >
             {visualFX && <div className={clsx("absolute inset-0 animate-ping rounded-xl opacity-10", pingColor)} />}
             <Icon className={clsx("w-10 h-10 mb-1", visualFX && "drop-shadow-md", colorClass)} />
             <span className={clsx("text-[10px] font-black uppercase tracking-widest", visualFX && "drop-shadow-md", colorClass)}>
                 {label}
             </span>
        </div>
    );
};

const ObstacleItemView: React.FC<{
    item: ObstacleItem;
    index: number;
    obstacleId: number;
    isGlitchActive: boolean;
    isBleachActive: boolean;
    isBlockerActive: boolean;
    isGpsActive: boolean;
    isGuidedTarget: boolean;
    visualFX: boolean;
    isWarpGhost: boolean;
    showWarpGuidance: boolean;
    itemCount: number;
}> = ({ 
    item, index, obstacleId, isGlitchActive, isBleachActive, 
    isBlockerActive, isGpsActive, isGuidedTarget, visualFX, 
    isWarpGhost, showWarpGuidance, itemCount 
}) => {
    
    const displayedText = useMemo(() => {
        if (!isGlitchActive) return item.wordText;
        return item.glitchText || getGlitchText(item.wordText, obstacleId + index * 10);
    }, [isGlitchActive, item.wordText, item.glitchText, obstacleId, index]);

    if (item.isHit) {
        return (
           <div className="relative w-full h-full flex justify-center items-center">
               <div 
                   className={clsx(
                       "w-24 h-24 rounded-full flex justify-center items-center shadow-lg border-4 border-white",
                       isWarpGhost ? "bg-fuchsia-500 border-fuchsia-200" : BG_COLOR_CLASS_MAP[item.displayColor],
                   )}
                   style={{ animation: 'explode 0.2s ease-out forwards' }}
               >
                    <div className="absolute inset-0 rounded-full border-2 border-white opacity-50 scale-125"></div>
               </div>
           </div>
        )
    }

    if (isWarpGhost) {
        const isTarget = item.isCorrect && showWarpGuidance;
        let ghostClass = "";
        let iconClass = "";
        
        if (showWarpGuidance) {
            if (isTarget) {
                ghostClass = "border-fuchsia-300 bg-slate-900 shadow-[0_0_25px_rgba(232,121,249,0.8)] z-20 opacity-100";
                iconClass = "text-fuchsia-200 drop-shadow-[0_0_5px_rgba(255,255,255,0.8)]";
            } else {
                ghostClass = "border-fuchsia-900/20 bg-slate-950/50 shadow-none opacity-20 z-10";
                iconClass = "text-fuchsia-900/20";
            }
        } else {
            ghostClass = "border-fuchsia-500/40 bg-slate-900/40 shadow-[0_0_10px_rgba(192,38,233,0.2)] z-10 opacity-75";
            iconClass = "text-fuchsia-500/50";
        }

        return (
            <div className="relative w-full h-full flex justify-center items-center">
                <div className="absolute top-1/2 w-full h-1 bg-fuchsia-900/50 -z-10" />
                <div className={clsx(
                    "w-24 h-24 rounded-full flex justify-center items-center border-4 relative transition-all duration-300",
                    ghostClass
                )}
                style={{ animation: isTarget ? 'warp-pulse 1s ease-in-out infinite' : 'none' }}
                >
                    {isTarget && (
                        <div className="absolute inset-[-6px] rounded-full border-2 border-fuchsia-500 opacity-60 animate-ping" />
                    )}
                    <div className={clsx(
                        "w-16 h-16 rounded-full border-2 border-fuchsia-400/30 flex justify-center items-center",
                        isTarget && "bg-fuchsia-500/10"
                    )}>
                         <Infinity className={clsx("w-8 h-8", iconClass)} />
                    </div>
                </div>
            </div>
        );
    }

    const isLightBg = item.displayColor === ColorType.WHITE || item.displayColor === ColorType.YELLOW;
    const isBlocked = isBlockerActive && ((obstacleId + index) % itemCount === 0);
    const isGpsTarget = isGpsActive && item.isCorrect;

    return (
        <div className="relative w-full h-full flex justify-center items-center">
            <div className="absolute top-1/2 w-full h-1 bg-slate-700/50 -z-10" />
            <div 
                className={clsx(
                    "w-24 h-24 rounded-full flex justify-center items-center border-4 transition-transform relative overflow-hidden",
                    visualFX ? "shadow-lg" : "shadow-sm",
                    BG_COLOR_CLASS_MAP[item.displayColor],
                    isGuidedTarget
                        ? "border-yellow-300 ring-8 ring-yellow-500/50 z-30 animate-[guidance-pulse_1s_infinite] shadow-[0_0_40px_rgba(250,204,21,0.8)]"
                    : isGpsTarget 
                        ? "border-teal-400 ring-4 ring-teal-500/30 scale-110 z-20" 
                        : (item.displayColor === ColorType.BLACK ? "border-slate-950" : "border-slate-900")
                )}
            >
                {isGuidedTarget && (
                    <div className="absolute -top-12 left-1/2 -translate-x-1/2 animate-bounce z-40 drop-shadow-[0_4px_4px_rgba(0,0,0,0.5)]">
                        <Lightbulb className="w-10 h-10 text-yellow-300 fill-yellow-500 stroke-[3]" />
                    </div>
                )}
                {isGpsTarget && !isGuidedTarget && (
                    <div className="absolute -top-10 left-1/2 -translate-x-1/2 animate-bounce z-30 drop-shadow-lg">
                        <MapPin className="w-8 h-8 text-teal-400 fill-teal-900" />
                    </div>
                )}
                {isBleachActive && (
                    <div className="absolute inset-0 bg-white opacity-[0.65] z-0 pointer-events-none" />
                )}
                <div className={clsx(
                    "w-20 h-20 rounded-full border-2 flex justify-center items-center relative z-10",
                    isLightBg ? "border-slate-900/10" : "border-white/20", 
                    isLightBg ? "bg-white/30" : "bg-black/30" 
                )}>
                    <span className={clsx(
                        "font-bold font-mono text-base font-black tracking-wider truncate px-1",
                        visualFX && "drop-shadow-md",
                        isLightBg ? "text-slate-900" : "text-white",
                        isGlitchActive && "tracking-tighter font-mono"
                    )}>
                        {displayedText}
                    </span>
                </div>
            </div>
            {isBlocked && (
                <div className="absolute inset-0 flex items-center justify-center z-20 animate-in zoom-in duration-300">
                    <div 
                        className="w-28 h-24 bg-amber-400 border-4 border-black rounded-lg flex flex-col items-center justify-center shadow-2xl transform rotate-1"
                        style={{
                            backgroundImage: 'repeating-linear-gradient(45deg, #fbbf24, #fbbf24 10px, #000 10px, #000 20px)'
                        }}
                    >
                        <div className="w-16 h-16 bg-black rounded-full flex items-center justify-center border-2 border-amber-500 shadow-lg">
                            <TriangleAlert className="w-10 h-10 text-amber-500 animate-pulse" />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const ObstacleComponent = forwardRef<HTMLDivElement, ObstacleProps>(({ 
    obstacle, 
    activeEffect, 
    wildEffects = [], 
    visualFX = true, 
    isWarpGhost = false, 
    showWarpGuidance = false,
    shouldHighlightGuided = true,
    zIndex = 10 
}, ref) => {
  if (!obstacle.active) {
    return (
        <div 
            ref={ref} 
            className="absolute w-full pointer-events-none" 
            style={{ display: 'none', top: `${obstacle.y}%` }} 
        />
    );
  }

  const itemCount = obstacle.items.length;
  
  const isEffectActive = (type: PowerUpType) => {
      if (activeEffect === type) return true;
      if (activeEffect === PowerUpType.WILD && wildEffects.includes(type)) return true;
      return false;
  };

  const isGlitchActive = isEffectActive(PowerUpType.GLITCH);
  const isBleachActive = isEffectActive(PowerUpType.BLEACH);
  const isBlockerActive = isEffectActive(PowerUpType.BLOCKER);
  const isGpsActive = isEffectActive(PowerUpType.GPS);

  return (
    <div
      ref={ref}
      className="absolute w-full px-0 pointer-events-none will-change-transform"
      style={{ 
        top: `${obstacle.y}%`,
        transform: 'translate3d(0, -50%, 0)',
        height: '110px',
        left: 0,
        zIndex: zIndex,
        display: 'grid',
        gridTemplateColumns: `repeat(${itemCount}, minmax(0, 1fr))`
      }}
    >
        <style>{`
            @keyframes explode {
                0% { transform: scale(1); opacity: 1; filter: brightness(1); }
                30% { transform: scale(1.1); opacity: 0.8; filter: brightness(2); }
                100% { transform: scale(1.8); opacity: 0; filter: brightness(3) blur(6px); }
            }
            @keyframes rainbow-pulse {
                0% { filter: hue-rotate(0deg) brightness(1.2); }
                100% { filter: hue-rotate(360deg) brightness(1.2); }
            }
            @keyframes warp-pulse {
                0%, 100% { transform: scale(1); box-shadow: 0 0 10px rgba(192,38,233,0.3); }
                50% { transform: scale(1.05); box-shadow: 0 0 20px rgba(192,38,233,0.6); }
            }
            @keyframes guidance-pulse {
                0%, 100% { transform: scale(1.05); opacity: 0.8; box-shadow: 0 0 15px rgba(250,204,21,0.5); }
                50% { transform: scale(1.15); opacity: 1; box-shadow: 0 0 35px rgba(250,204,21,0.9); }
            }
        `}</style>
      
      {(obstacle.transitionZoneHeight || 0) > 0 && (
         <div 
           className="absolute left-0 right-0 -z-20 pointer-events-none"
           style={{ 
               top: '100%', 
               height: `${obstacle.transitionZoneHeight}%`,
               display: 'grid',
               gridTemplateColumns: `repeat(${itemCount}, minmax(0, 1fr))`
           }}
         >
            {Array.from({ length: itemCount }).map((_, i) => (
                 <div key={i} className="w-full h-full" />
            ))}
         </div>
      )}

      {obstacle.items.map((item, index) => {
        if (item.isEmpty) { 
             return <div key={index} className="relative w-full h-full" />;
        }

        if (obstacle.type === ObstacleType.CRATE) {
             const effect = item.effect || PowerUpType.SPEED;
             const { bgClass, borderClass, shadowClass } = getCrateStyles(effect, visualFX);

             if (item.isHit) {
                 return (
                    <div key={index} className="relative w-full h-full flex justify-center items-center">
                        <div className={clsx(
                            "w-24 h-24 rounded-xl flex items-center justify-center relative",
                            bgClass,
                            borderClass,
                            shadowClass
                        )} style={{ animation: 'explode 0.2s ease-out forwards' }}>
                             <div className={clsx("absolute inset-0 rounded-xl bg-white")} />
                        </div>
                    </div>
                 );
             }

             return (
                <div key={index} className="relative w-full h-full flex justify-center items-center">
                    <CrateVisual effect={effect} visualFX={visualFX} />
                </div>
             );
        }

        return (
            <ObstacleItemView 
                key={index}
                item={item}
                index={index}
                obstacleId={obstacle.id}
                isGlitchActive={isGlitchActive}
                isBleachActive={isBleachActive}
                isBlockerActive={isBlockerActive}
                isGpsActive={isGpsActive}
                isGuidedTarget={shouldHighlightGuided && obstacle.isGuided && item.isCorrect}
                visualFX={visualFX}
                isWarpGhost={isWarpGhost}
                showWarpGuidance={showWarpGuidance}
                itemCount={itemCount}
            />
        );
      })}
    </div>
  );
});

export default React.memo(ObstacleComponent, (prev, next) => {
    if (prev.obstacle.id !== next.obstacle.id) return false;
    if (prev.obstacle.active !== next.obstacle.active) return false;
    
    // Deep check items if id is same (for hit detection updates which happen in-place)
    if (prev.obstacle.items !== next.obstacle.items) return false;
    for(let i=0; i<prev.obstacle.items.length; i++) {
        const pItem = prev.obstacle.items[i];
        const nItem = next.obstacle.items[i];
        if (pItem.isEmpty !== nItem.isEmpty) return false;
        if (!pItem.isEmpty && !nItem.isEmpty) {
            if (pItem.isHit !== nItem.isHit) return false;
        }
    }

    if (prev.visualFX !== next.visualFX) return false;
    if (prev.activeEffect !== next.activeEffect) return false;
    if (prev.isWarpGhost !== next.isWarpGhost) return false;
    if (prev.showWarpGuidance !== next.showWarpGuidance) return false;
    if (prev.shouldHighlightGuided !== next.shouldHighlightGuided) return false;
    if (prev.zIndex !== next.zIndex) return false;

    // Wild Effects Array Comparison
    const prevWild = prev.wildEffects || [];
    const nextWild = next.wildEffects || [];
    if (prevWild.length !== nextWild.length) return false;
    for (let i = 0; i < prevWild.length; i++) {
        if (prevWild[i] !== nextWild[i]) return false;
    }

    return true;
});
