
import React, { useState, useEffect } from 'react';
import Game from './components/Game';
import SettingsOverlay from './components/SettingsOverlay';
import { GameState, AppSettings, PowerUpType, PracticeConfig, PracticeMode } from './types';
import { Play, RotateCcw, BrainCircuit, Settings, GraduationCap, ChevronLeft, Package, Check, Info, X, BookOpen, Eye, EyeOff, Palette, Type, ChevronRight } from 'lucide-react';
import { audioManager } from './utils/audio';
import { CRATE_METADATA } from './constants';
import clsx from 'clsx';
import { CrateVisual } from './components/Obstacle';

function App() {
  const [gameState, setGameState] = useState<GameState>(GameState.MENU);
  const [score, setScore] = useState(0);
  const [finalTime, setFinalTime] = useState(0); // Store final time for Game Over screen
  const [highScore, setHighScore] = useState(0);
  const [gameId, setGameId] = useState(0);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isPracticeMenuOpen, setIsPracticeMenuOpen] = useState(false);
  const [infoModalCrate, setInfoModalCrate] = useState<PowerUpType | null>(null);
  const [isViewingCrash, setIsViewingCrash] = useState(false);
  
  // Pre-Game Guide State
  const [showPreGameGuide, setShowPreGameGuide] = useState(false);
  const [guideStep, setGuideStep] = useState(0);

  // Practice Configuration State
  const [practiceConfig, setPracticeConfig] = useState<PracticeConfig>({
      isActive: false,
      mode: 'NONE'
  });
  
  // Temporary state for the practice menu configuration
  const [tempPracticeMode, setTempPracticeMode] = useState<PracticeMode>('SINGLE_CRATE');
  const [tempSelectedCrate, setTempSelectedCrate] = useState<PowerUpType>(PowerUpType.SPEED);
  const [practiceStep, setPracticeStep] = useState<'MODE_SELECT' | 'CRATE_SELECT'>('MODE_SELECT');

  // Global Settings State
  const [settings, setSettings] = useState<AppSettings>({
      masterVol: 0.4,
      bgmVol: 0.35,
      sfxVol: 1.0,
      visualFX: true,
      haptics: true,
      crateToggles: {
          [PowerUpType.SPEED]: true,
          [PowerUpType.DRUNK]: true,
          [PowerUpType.FOG]: true,
          [PowerUpType.DYSLEXIA]: true,
          [PowerUpType.GPS]: true,
          [PowerUpType.BLOCKER]: true,
          [PowerUpType.WILD]: true,
          [PowerUpType.GLITCH]: true,
          [PowerUpType.BLEACH]: true,
          [PowerUpType.ALIAS]: true,
          [PowerUpType.WARP]: true,
          [PowerUpType.NONE]: true,
      }
  });

  // Load Settings
  useEffect(() => {
    try {
        const savedSettings = localStorage.getItem('V3_GAME_SETTINGS');
        if (savedSettings) {
            const parsed = JSON.parse(savedSettings);
            setSettings(prev => ({
                ...prev,
                ...parsed,
                crateToggles: { ...prev.crateToggles, ...(parsed.crateToggles || {}) }
            }));
            if (parsed.masterVol !== undefined) audioManager.setMasterVolume(parsed.masterVol);
            if (parsed.bgmVol !== undefined) audioManager.setBGMVolume(parsed.bgmVol);
            if (parsed.sfxVol !== undefined) audioManager.setSFXVolume(parsed.sfxVol);
        }
    } catch (e) {
        console.error("Failed to load data", e);
    }
  }, []);

  // Save Settings
  useEffect(() => {
    try {
        localStorage.setItem('V3_GAME_SETTINGS', JSON.stringify(settings));
    } catch (e) {
        console.error("Failed to save settings", e);
    }
  }, [settings]);

  // Audio Context Visibility & Resume Logic
  useEffect(() => {
    const handleVisibilityChange = () => {
        // When hidden, we must explicitly pause audio for iOS/mobile compatibility
        if (document.visibilityState === 'hidden') {
            audioManager.setSystemPaused(true);
        } else {
            // When visible, try to resume (audioManager checks if logic pause is active)
            audioManager.setSystemPaused(false);
        }
    };
    
    // Unlock/Resume audio on interaction if visible
    const handleInteraction = () => {
         if (document.visibilityState === 'visible') {
             audioManager.setSystemPaused(false);
         }
    };
    
    // Check initial state
    if (document.visibilityState === 'hidden') {
        audioManager.setSystemPaused(true);
    }
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleInteraction); 
    window.addEventListener('click', handleInteraction);
    window.addEventListener('touchstart', handleInteraction);

    return () => {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
        window.removeEventListener('focus', handleInteraction);
        window.removeEventListener('click', handleInteraction);
        window.removeEventListener('touchstart', handleInteraction);
    };
  }, []);

  const handleUpdateSettings = (key: keyof AppSettings, value: any) => {
    setSettings(prev => {
        const newSettings = { ...prev, [key]: value };
        if (key === 'masterVol') audioManager.setMasterVolume(value as number);
        if (key === 'bgmVol') audioManager.setBGMVolume(value as number);
        if (key === 'sfxVol') audioManager.setSFXVolume(value as number);
        return newSettings;
    });
  };

  const startGame = (mode: 'NORMAL' | 'PRACTICE' = 'NORMAL') => {
    audioManager.init();
    // Enforce BGM Start at 100% Volume
    audioManager.startBGM(true); 

    setScore(0);
    setFinalTime(0);
    setGameId(prev => prev + 1); 
    setIsViewingCrash(false);
    setShowPreGameGuide(false);
    
    if (mode === 'PRACTICE') {
        setPracticeConfig({
            isActive: true,
            mode: tempPracticeMode,
            selectedCrate: tempPracticeMode === 'SINGLE_CRATE' ? tempSelectedCrate : undefined
        });
    } else {
        setPracticeConfig({ isActive: false, mode: 'NONE' });
    }
    
    setGameState(GameState.PLAYING);
    setIsPracticeMenuOpen(false);
  };

  const handleGameOver = (finalScore: number, time: number) => {
    setGameState(GameState.GAME_OVER);
    setFinalTime(time);
    // Only update high score if not in practice mode
    if (!practiceConfig.isActive && finalScore > highScore) {
      setHighScore(finalScore);
    }
  };

  const formatTime = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    const centis = Math.floor((ms % 1000) / 10);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${centis.toString().padStart(2, '0')}`;
  };

  const crateOptions = [
      PowerUpType.SPEED, PowerUpType.DRUNK, PowerUpType.FOG, PowerUpType.DYSLEXIA,
      PowerUpType.GPS, PowerUpType.BLOCKER, PowerUpType.WILD, PowerUpType.GLITCH,
      PowerUpType.BLEACH, PowerUpType.ALIAS, PowerUpType.WARP
  ].sort((a, b) => {
      // Sort descending by score
      return CRATE_METADATA[b].score - CRATE_METADATA[a].score;
  });

  const totalGuideSteps = 1 + crateOptions.length;

  const handleGuideNext = () => {
    if (guideStep < totalGuideSteps - 1) {
        setGuideStep(prev => prev + 1);
    } else {
        setGuideStep(0); // Loop back
    }
  };

  const handleGuidePrev = () => {
    if (guideStep > 0) {
        setGuideStep(prev => prev - 1);
    }
  };

  return (
    // Use fixed inset-0 and 100dvh to prevent mobile browser UI (address bar) from hiding game content
    <div className="fixed inset-0 w-full h-[100dvh] bg-black flex justify-center items-center font-sans select-none text-slate-100 overflow-hidden">
      
      <div className="relative w-full max-w-md h-full bg-slate-950 shadow-2xl overflow-hidden border-x border-slate-800">
        
        <div className="absolute inset-0">
            
            {/* Global Settings Overlay */}
            {isSettingsOpen && (
                <SettingsOverlay 
                    settings={settings}
                    onUpdateSettings={handleUpdateSettings}
                    onClose={() => setIsSettingsOpen(false)}
                />
            )}

            {/* Pre-Game Guide Modal */}
            {showPreGameGuide && (
                <div className="absolute inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md p-6">
                    <div className="bg-slate-900 border-2 border-slate-700 rounded-2xl p-6 shadow-2xl max-w-sm w-full flex flex-col items-center gap-6 relative animate-in fade-in zoom-in duration-300">
                        {/* Header Content */}
                        {guideStep === 0 ? (
                            <div className="flex flex-col items-center gap-4 text-center w-full">
                                <h2 className="text-2xl font-black italic text-white uppercase tracking-widest border-b border-slate-700 pb-2 w-full">
                                    HOW TO SURVIVE
                                </h2>
                                <div className="flex gap-4 items-center justify-center py-6">
                                    <div className="flex flex-col items-center gap-2">
                                        <div className="p-4 bg-slate-800 rounded-xl border border-cyan-500/50 shadow-[0_0_15px_rgba(34,211,238,0.3)]">
                                            <Palette className="w-8 h-8 text-cyan-400" />
                                        </div>
                                        <div className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest">Color Rule</div>
                                    </div>
                                    <div className="text-slate-500 font-black text-xl italic">VS</div>
                                    <div className="flex flex-col items-center gap-2">
                                        <div className="p-4 bg-slate-800 rounded-xl border border-orange-500/50 shadow-[0_0_15px_rgba(249,115,22,0.3)]">
                                            <Type className="w-8 h-8 text-orange-400" />
                                        </div>
                                        <div className="text-[10px] font-bold text-orange-400 uppercase tracking-widest">Word Rule</div>
                                    </div>
                                </div>
                                <p className="text-slate-300 text-sm leading-relaxed px-1">
                                    The objective changes constantly.<br/>Match the <span className="text-cyan-400 font-bold">INK COLOR</span> or the <span className="text-orange-400 font-bold">WRITTEN WORD</span>.
                                </p>
                            </div>
                        ) : (
                            (() => {
                                const crateType = crateOptions[guideStep - 1];
                                const meta = CRATE_METADATA[crateType];
                                return (
                                    <div className="flex flex-col items-center gap-4 text-center w-full">
                                        <div className="flex justify-between items-center w-full border-b border-slate-700 pb-2">
                                            <h2 className="text-xl font-black italic text-white uppercase tracking-widest">
                                                POWER-UPS
                                            </h2>
                                            <span className="text-xs font-bold text-slate-500 bg-slate-800 px-2 py-1 rounded">
                                                {guideStep}/{crateOptions.length}
                                            </span>
                                        </div>
                                        
                                        <div className="py-4 transform scale-125">
                                            <CrateVisual effect={crateType} visualFX={true} />
                                        </div>
                                        
                                        <div className="space-y-2">
                                            <h3 className="text-2xl font-black text-white uppercase tracking-tight">
                                                {meta.label}
                                            </h3>
                                            <p className="text-slate-300 text-sm leading-relaxed min-h-[3rem]">
                                                {meta.description}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })()
                        )}

                        {/* Footer Navigation */}
                        <div className="w-full flex flex-col gap-3 mt-2">
                            <button 
                                onClick={() => startGame('NORMAL')}
                                className="w-full py-4 bg-cyan-500 hover:bg-cyan-400 text-slate-900 font-black text-xl uppercase tracking-widest rounded-xl transition-all shadow-[0_0_20px_rgba(6,182,212,0.4)] active:scale-95 flex items-center justify-center gap-2"
                            >
                                <Play className="w-6 h-6 fill-current" />
                                START GAME
                            </button>
                            
                            <div className="flex justify-between items-center w-full px-1">
                                <button 
                                    onClick={handleGuidePrev}
                                    disabled={guideStep === 0}
                                    className={clsx(
                                        "p-2 rounded-full transition-colors",
                                        guideStep === 0 ? "text-slate-800 cursor-not-allowed" : "text-slate-400 hover:text-white hover:bg-slate-800"
                                    )}
                                >
                                    <ChevronLeft className="w-8 h-8" />
                                </button>
                                
                                <div className="flex gap-1">
                                    {Array.from({ length: 5 }).map((_, i) => (
                                        <div 
                                            key={i} 
                                            className={clsx(
                                                "w-1.5 h-1.5 rounded-full transition-colors",
                                                (i === 0 && guideStep === 0) || (guideStep > 0 && i > 0) ? "bg-cyan-500/50" : "bg-slate-800"
                                            )} 
                                        />
                                    ))}
                                </div>

                                <button 
                                    onClick={handleGuideNext}
                                    className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-full transition-colors"
                                >
                                    <ChevronRight className="w-8 h-8" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Crate Info Modal */}
            {infoModalCrate && (
                <div className="absolute inset-0 z-[90] flex items-center justify-center bg-black/60 backdrop-blur-sm p-6" onClick={() => setInfoModalCrate(null)}>
                    <div className="bg-slate-800 border border-slate-600 p-6 rounded-xl shadow-2xl max-w-[280px] w-full animate-in zoom-in fade-in duration-200 flex flex-col gap-4 text-center" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-center mb-4">
                                <CrateVisual effect={infoModalCrate} />
                        </div>

                        <div className="flex justify-between items-start">
                                <div className="flex items-center gap-2">
                                    <Info className="w-5 h-5 text-cyan-400" />
                                    <h3 className="text-xl font-black text-white tracking-wider uppercase">
                                        {CRATE_METADATA[infoModalCrate].label}
                                    </h3>
                                </div>
                                <button onClick={() => setInfoModalCrate(null)} className="text-slate-400 hover:text-white">
                                    <X className="w-5 h-5" />
                                </button>
                        </div>
                        <p className="text-sm text-slate-300 font-medium leading-relaxed">
                            {CRATE_METADATA[infoModalCrate].description}
                        </p>
                        <div className="pt-2 text-[10px] text-slate-500 uppercase tracking-widest font-bold">
                            Tap outside to close
                        </div>
                    </div>
                </div>
            )}

            {/* Practice Menu Overlay */}
            {isPracticeMenuOpen && (
                <div className="absolute inset-0 z-[80] flex items-center justify-center bg-black/80 backdrop-blur-md p-6">
                    <div className="w-full bg-slate-900 border border-slate-700 rounded-2xl p-4 shadow-2xl animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">
                        
                        <div className="flex items-center justify-between mb-6">
                            <button 
                                onClick={() => practiceStep === 'CRATE_SELECT' ? setPracticeStep('MODE_SELECT') : setIsPracticeMenuOpen(false)}
                                className="p-2 -ml-2 text-slate-400 hover:text-white transition-colors"
                            >
                                <ChevronLeft className="w-6 h-6" />
                            </button>
                            <h2 className="text-xl font-black italic text-center text-white tracking-widest uppercase">
                                {practiceStep === 'MODE_SELECT' ? 'PRACTICE MODE' : 'SELECT CRATE'}
                            </h2>
                            <div className="w-6" />
                        </div>

                        {practiceStep === 'MODE_SELECT' ? (
                            <div className="space-y-3 flex-1 overflow-y-auto pr-1 custom-scrollbar">
                                <button
                                    onClick={() => { setTempPracticeMode('SINGLE_CRATE'); setPracticeStep('CRATE_SELECT'); }}
                                    className={clsx(
                                        "w-full p-4 rounded-xl border-2 text-left transition-all active:scale-95 flex justify-between items-center",
                                        tempPracticeMode === 'SINGLE_CRATE' 
                                            ? "bg-yellow-500/20 border-yellow-500 text-white shadow-[0_0_15px_rgba(234,179,8,0.3)]" 
                                            : "bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-500"
                                    )}
                                >
                                    <div>
                                        <div className="font-bold text-lg mb-1">PRACTICE WITH CRATE</div>
                                        <div className="text-xs opacity-70">Practice a specific crate effect.</div>
                                    </div>
                                    {tempPracticeMode === 'SINGLE_CRATE' && <ChevronLeft className="w-5 h-5 rotate-180" />}
                                </button>

                                <button
                                    onClick={() => setTempPracticeMode('FOUR_LANES')}
                                    className={clsx(
                                        "w-full p-4 rounded-xl border-2 text-left transition-all active:scale-95",
                                        tempPracticeMode === 'FOUR_LANES' 
                                            ? "bg-cyan-500/20 border-cyan-500 text-white shadow-[0_0_15px_rgba(6,182,212,0.3)]" 
                                            : "bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-500"
                                    )}
                                >
                                    <div className="font-bold text-lg mb-1">4 LANES ONLY</div>
                                    <div className="text-xs opacity-70">Exclusively uses the 4-lane track system.</div>
                                </button>

                                <button
                                    onClick={() => setTempPracticeMode('COLOR_ONLY')}
                                    className={clsx(
                                        "w-full p-4 rounded-xl border-2 text-left transition-all active:scale-95",
                                        tempPracticeMode === 'COLOR_ONLY' 
                                            ? "bg-blue-500/20 border-blue-500 text-white shadow-[0_0_15px_rgba(59,130,246,0.3)]" 
                                            : "bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-500"
                                    )}
                                >
                                    <div className="font-bold text-lg mb-1">COLOR MODE ONLY</div>
                                    <div className="text-xs opacity-70">Color objective only. No crates spawn.</div>
                                </button>

                                <button
                                    onClick={() => setTempPracticeMode('WORD_ONLY')}
                                    className={clsx(
                                        "w-full p-4 rounded-xl border-2 text-left transition-all active:scale-95",
                                        tempPracticeMode === 'WORD_ONLY' 
                                            ? "bg-orange-500/20 border-orange-500 text-white shadow-[0_0_15px_rgba(249,115,22,0.3)]" 
                                            : "bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-500"
                                    )}
                                >
                                    <div className="font-bold text-lg mb-1">WORD MODE ONLY</div>
                                    <div className="text-xs opacity-70">Word objective only. No crates spawn.</div>
                                </button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 gap-4 flex-1 overflow-y-auto p-4 custom-scrollbar content-start">
                                {crateOptions.map(crate => (
                                    <div key={crate} className="relative">
                                        <button
                                            onClick={() => setTempSelectedCrate(crate)}
                                            className={clsx(
                                                "w-full p-3 rounded-xl border-2 flex flex-col items-center gap-2 transition-all active:scale-95",
                                                tempSelectedCrate === crate
                                                    ? "bg-slate-700 border-white shadow-lg scale-105"
                                                    : "bg-slate-800 border-slate-700 text-slate-500 opacity-60 hover:opacity-100"
                                            )}
                                        >
                                            <div className="scale-[0.55] origin-center pointer-events-none">
                                                <CrateVisual effect={crate} />
                                            </div>
                                            <span className="text-[10px] font-bold uppercase pointer-events-none">{CRATE_METADATA[crate].label}</span>
                                        </button>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); setInfoModalCrate(crate); }}
                                            className="absolute top-2 right-2 p-1.5 bg-slate-900/50 hover:bg-slate-800 rounded-full text-slate-400 hover:text-cyan-400 transition-colors z-10 border border-transparent hover:border-cyan-500/30"
                                        >
                                            <Info className="w-3 h-3" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        {practiceStep === 'MODE_SELECT' && (
                            <button 
                                onClick={() => startGame('PRACTICE')}
                                className="w-full py-4 bg-cyan-500 hover:bg-cyan-400 text-slate-900 font-bold text-xl rounded-xl mt-4 active:scale-95 transition-transform uppercase tracking-wider shadow-[0_0_20px_rgba(6,182,212,0.4)]"
                            >
                                START PRACTICE
                            </button>
                        )}
                        
                        {practiceStep === 'CRATE_SELECT' && (
                             <button 
                                onClick={() => setPracticeStep('MODE_SELECT')}
                                className="w-full py-3 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded-xl mt-4 active:scale-95 transition-transform"
                            >
                                CONFIRM SELECTION
                            </button>
                        )}
                    </div>
                </div>
            )}

            {(gameState === GameState.PLAYING || gameState === GameState.GAME_OVER) && (
                <Game 
                    key={gameId}
                    isActive={gameState === GameState.PLAYING} 
                    onGameOver={handleGameOver} 
                    onScoreUpdate={setScore}
                    onQuit={() => setGameState(GameState.MENU)}
                    onRestart={() => startGame(practiceConfig.isActive ? 'PRACTICE' : 'NORMAL')}
                    score={score}
                    highScore={highScore}
                    settings={settings}
                    isSettingsOpen={isSettingsOpen}
                    onOpenSettings={() => setIsSettingsOpen(true)}
                    practiceConfig={practiceConfig}
                />
            )}

            {gameState === GameState.MENU && (
            <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-900/90 backdrop-blur-sm p-6">
                <div className="w-full text-center space-y-6 animate-in fade-in zoom-in duration-300">
                
                <div className="space-y-2">
                    <div className="flex justify-center mb-4">
                        <div className="p-4 bg-cyan-500/10 rounded-full ring-2 ring-cyan-500/50 shadow-[0_0_30px_rgba(6,182,212,0.3)]">
                            <BrainCircuit className="w-12 h-12 text-cyan-400" />
                        </div>
                    </div>
                    <h1 className="text-4xl font-black italic tracking-tighter text-white">
                    COLOR <span className="text-cyan-400">CONFLICT</span>
                    </h1>
                    <p className="text-slate-400 text-sm">Stroop Effect Racing</p>
                </div>

                <div className="space-y-3 bg-slate-800/50 p-4 rounded-xl border border-slate-700">
                    <h2 className="text-xs font-bold text-slate-300 uppercase tracking-widest mb-2">How to Play</h2>
                    <div className="grid gap-3 text-left">
                        <div className="flex items-start gap-3">
                            <div className="px-1.5 py-0.5 bg-slate-700 rounded text-cyan-400 font-bold text-xs shrink-0 mt-0.5">1</div>
                            <p className="text-xs text-slate-300 leading-tight">Tap lanes to steer the <span className="text-white font-bold">HOVERBOARD</span>.</p>
                        </div>
                        <div className="flex items-start gap-3">
                            <div className="px-1.5 py-0.5 bg-slate-700 rounded text-purple-400 font-bold text-xs shrink-0 mt-0.5">2</div>
                            <p className="text-xs text-slate-300 leading-tight">Follow the <span className="text-white font-bold">Objective (Rule/Target)</span> displayed at the top.</p>
                        </div>
                        <div className="flex items-start gap-3">
                            <div className="px-1.5 py-0.5 bg-slate-700 rounded text-blue-400 font-bold text-xs shrink-0 mt-0.5">3</div>
                            <p className="text-xs text-slate-300 leading-tight">
                                Rule: <span className="text-cyan-400 font-bold">COLOR</span> (Dark Blue Track) - Match the actual color. <span className="text-slate-400 italic">Ex: Hit RED circle.</span>
                            </p>
                        </div>
                        <div className="flex items-start gap-3">
                            <div className="px-1.5 py-0.5 bg-slate-700 rounded text-orange-400 font-bold text-xs shrink-0 mt-0.5">4</div>
                            <p className="text-xs text-slate-300 leading-tight">
                                Rule: <span className="text-orange-400 font-bold">WORD</span> (Dark Orange Track) - Match the word written. <span className="text-slate-400 italic">Ex: Hit circle reading BLUE.</span>
                            </p>
                        </div>
                        <div className="flex items-start gap-3">
                            <div className="px-1.5 py-0.5 bg-slate-700 rounded text-yellow-400 font-bold text-xs shrink-0 mt-0.5">5</div>
                            <p className="text-xs text-slate-300 leading-tight">
                                The track alternates: every third level (3, 6, 9...) switches to a <span className="text-yellow-400 font-bold">4-lane track</span>.
                            </p>
                        </div>
                        <div className="flex items-start gap-3">
                            <div className="px-1.5 py-0.5 bg-slate-700 rounded text-pink-400 font-bold text-xs shrink-0 mt-0.5">6</div>
                            <p className="text-xs text-slate-300 leading-tight">
                                <span className="text-white font-bold">Crates</span> apply chaotic effects (e.g., GLITCH, BLEACH, WILD) for bonus scores.
                            </p>
                        </div>
                    </div>
                </div>

                {/* MAIN BUTTONS */}
                <div className="flex flex-col gap-3 w-full">
                    {/* START BUTTON */}
                    <button 
                        onClick={() => {
                            setShowPreGameGuide(true);
                            setGuideStep(0);
                        }}
                        className="group relative w-full py-4 bg-cyan-500 hover:bg-cyan-400 text-slate-900 font-black text-xl uppercase tracking-widest transition-all hover:scale-[1.02] hover:shadow-[0_0_20px_rgba(6,182,212,0.6)] rounded-lg overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                        <span className="relative flex items-center justify-center gap-2">
                            <Play className="w-6 h-6 fill-current" />
                            Start
                        </span>
                    </button>
                    
                    <div className="flex gap-3">
                         <button
                            onClick={() => setIsSettingsOpen(true)}
                            className="p-3.5 bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 hover:border-slate-500 transition-colors shadow-lg shrink-0 flex items-center justify-center aspect-square"
                            aria-label="Settings"
                        >
                            <Settings className="w-6 h-6 text-slate-400" />
                        </button>
                        
                        <button 
                            onClick={() => setIsPracticeMenuOpen(true)}
                            className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-bold text-sm uppercase tracking-widest transition-all hover:scale-[1.02] border border-slate-700 rounded-lg flex items-center justify-center gap-2"
                        >
                            <GraduationCap className="w-4 h-4" />
                            Practice Mode
                        </button>
                    </div>
                </div>

                </div>
            </div>
            )}

            {gameState === GameState.GAME_OVER && (
            <div className={clsx(
                "absolute inset-0 z-50 flex items-center justify-center p-6 transition-all duration-500",
                isViewingCrash ? "bg-transparent pointer-events-none" : "bg-black/85 backdrop-blur-sm"
            )}>
                {!isViewingCrash ? (
                <div className="text-center space-y-6 animate-in zoom-in duration-300 w-full">
                    <div className="space-y-2">
                        <h2 className="text-5xl font-black text-red-500 italic tracking-tighter drop-shadow-[0_0_10px_rgba(239,68,68,0.5)]">CRASHED</h2>
                        <p className="text-lg text-slate-300">Mind Overloaded.</p>
                    </div>
                    
                    <div className="py-6 border-y border-white/10">
                        {/* Final Score */}
                        <div className="text-xs text-slate-500 font-mono uppercase tracking-widest mb-2">Final Score</div>
                        <div className="text-7xl font-mono font-bold text-white leading-none mb-6">{score}</div>

                        {/* NEW TIME DISPLAY */}
                        <div className="text-xs text-cyan-500 font-mono uppercase tracking-widest mb-1">Time Elapsed</div>
                        <div className="text-4xl font-mono font-bold text-cyan-400 leading-none drop-shadow-[0_0_10px_rgba(34,211,238,0.5)]">
                            {formatTime(finalTime)}
                        </div>

                        {practiceConfig.isActive && (
                            <div className="mt-4 inline-block px-3 py-1 bg-yellow-500/20 text-yellow-400 text-[10px] font-bold uppercase tracking-widest rounded-full border border-yellow-500/50">
                                Practice Mode
                            </div>
                        )}
                    </div>

                    <div className="flex flex-col gap-3">
                        <button 
                            onClick={() => startGame(practiceConfig.isActive ? 'PRACTICE' : 'NORMAL')}
                            className="flex items-center justify-center gap-2 w-full py-3 bg-white text-slate-900 hover:bg-slate-200 font-bold text-lg rounded-full transition-colors"
                        >
                            <RotateCcw className="w-5 h-5" />
                            Try Again
                        </button>
                        
                        <div className="flex items-center justify-between px-2 gap-2">
                            <button 
                                onClick={() => setGameState(GameState.MENU)}
                                className="flex-1 text-slate-500 hover:text-white text-sm py-2 px-4 hover:bg-white/5 rounded-lg transition-all"
                            >
                                Return to Menu
                            </button>
                            
                            <button 
                                onClick={() => setIsViewingCrash(true)}
                                className="flex items-center justify-center gap-2 text-slate-500 hover:text-cyan-400 text-sm py-2 px-4 hover:bg-cyan-950/30 rounded-lg transition-all whitespace-nowrap"
                                title="View Crash Site"
                            >
                                <Eye className="w-4 h-4" />
                                <span>View Crash</span>
                            </button>
                        </div>
                    </div>
                </div>
                ) : (
                    <button
                        onClick={() => setIsViewingCrash(false)}
                        className="absolute bottom-10 px-6 py-3 bg-slate-900/90 hover:bg-slate-800 text-white font-bold rounded-full border border-slate-600 shadow-xl pointer-events-auto animate-in fade-in slide-in-from-bottom-4 duration-300 flex items-center gap-2 backdrop-blur-md"
                    >
                        <EyeOff className="w-5 h-5" />
                        <span>Show Menu</span>
                    </button>
                )}
            </div>
            )}
            
            {settings.visualFX && <div className="scanlines pointer-events-none" />}
        </div>
      </div>
    </div>
  );
}

export default App;
