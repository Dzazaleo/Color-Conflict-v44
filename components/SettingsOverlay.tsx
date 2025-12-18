
import React, { useState } from 'react';
import { Eye, Gamepad2, PackageOpen, ChevronLeft, Info, X } from 'lucide-react';
import clsx from 'clsx';
import { AppSettings, PowerUpType } from '../types';
import { audioManager } from '../utils/audio';
import { CRATE_METADATA } from '../constants';
import { CrateVisual } from './Obstacle';

interface SettingsOverlayProps {
    settings: AppSettings;
    onUpdateSettings: (key: keyof AppSettings, value: any) => void;
    onClose: () => void;
}

const SettingsOverlay: React.FC<SettingsOverlayProps> = ({ settings, onUpdateSettings, onClose }) => {
    const [settingsView, setSettingsView] = useState<'MAIN' | 'CRATES'>('MAIN');
    const [settingsError, setSettingsError] = useState<string | null>(null);
    const [infoModalCrate, setInfoModalCrate] = useState<PowerUpType | null>(null);

    const crateTypes = [
        PowerUpType.SPEED, PowerUpType.DRUNK, PowerUpType.FOG, PowerUpType.DYSLEXIA, 
        PowerUpType.GPS, PowerUpType.BLOCKER, PowerUpType.WILD, PowerUpType.GLITCH, 
        PowerUpType.BLEACH, PowerUpType.ALIAS, PowerUpType.WARP
    ];

    const toggleCrate = (type: PowerUpType) => {
        // Calculate how many are currently enabled
        const activeCount = crateTypes.filter(t => settings.crateToggles[t]).length;
        const isTurningOff = settings.crateToggles[type];
  
        // Block if trying to turn OFF and we're at or below the minimum limit (3)
        if (isTurningOff && activeCount <= 3) {
            setSettingsError("Minimum 3 Crates Required");
            setTimeout(() => setSettingsError(null), 2000);
            return;
        }
  
        onUpdateSettings('crateToggles', {
            ...settings.crateToggles,
            [type]: !settings.crateToggles[type]
        });
    };

    return (
        <div className="absolute inset-0 z-[80] flex items-center justify-center bg-black/80 backdrop-blur-md p-6">
            <div className="w-full max-w-sm bg-slate-900 border border-slate-700 rounded-2xl p-6 shadow-2xl animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh] relative">
                
                {/* Crate Info Modal */}
                {infoModalCrate && (
                    <div className="absolute inset-0 z-[90] flex items-center justify-center bg-black/60 backdrop-blur-sm rounded-2xl p-6" onClick={() => setInfoModalCrate(null)}>
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

                {settingsView === 'MAIN' ? (
                    <>
                    <h2 className="text-2xl font-black italic text-center text-white mb-6 tracking-widest uppercase">
                        SETTINGS
                    </h2>
                    
                    <div className="space-y-6 overflow-y-auto pr-2 custom-scrollbar">
                        {/* Audio Controls */}
                        <div className="space-y-4">
                            <div className="space-y-1">
                                <div className="flex justify-between text-xs font-bold text-slate-400 uppercase tracking-widest">
                                    <span>Master Volume</span>
                                    <span>{Math.round(settings.masterVol * 100)}%</span>
                                </div>
                                <input 
                                    type="range" min="0" max="1" step="0.05"
                                    value={settings.masterVol}
                                    onChange={(e) => onUpdateSettings('masterVol', parseFloat(e.target.value))}
                                    className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                                />
                            </div>
                            
                            <div className="space-y-1">
                                <div className="flex justify-between text-xs font-bold text-slate-400 uppercase tracking-widest">
                                    <span>Music (BGM)</span>
                                    <span>{Math.round(settings.bgmVol * 100)}%</span>
                                </div>
                                <input 
                                    type="range" min="0" max="1" step="0.05"
                                    value={settings.bgmVol}
                                    onChange={(e) => onUpdateSettings('bgmVol', parseFloat(e.target.value))}
                                    className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                                />
                            </div>
                            
                            <div className="space-y-1">
                                <div className="flex justify-between text-xs font-bold text-slate-400 uppercase tracking-widest">
                                    <span>Sound FX</span>
                                    <span>{Math.round(settings.sfxVol * 100)}%</span>
                                </div>
                                <input 
                                    type="range" min="0" max="1" step="0.05"
                                    value={settings.sfxVol}
                                    onChange={(e) => {
                                        onUpdateSettings('sfxVol', parseFloat(e.target.value));
                                        audioManager.play('objective');
                                    }}
                                    className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                                />
                            </div>
                        </div>

                        {/* Toggles */}
                        <div className="space-y-3 pt-2 border-t border-slate-700/50">
                            <button 
                                onClick={() => onUpdateSettings('visualFX', !settings.visualFX)}
                                className="flex items-center justify-between w-full p-3 bg-slate-800 rounded-xl active:scale-95 transition-transform"
                            >
                                <div className="flex items-center gap-3">
                                    {settings.visualFX ? <Eye className="w-5 h-5 text-cyan-400" /> : <Eye className="w-5 h-5 text-slate-500" />}
                                    <span className="text-sm font-bold text-white">Visual FX</span>
                                </div>
                                <div className={clsx("w-10 h-5 rounded-full relative transition-colors", settings.visualFX ? "bg-cyan-500" : "bg-slate-600")}>
                                    <div className={clsx("absolute top-1 w-3 h-3 bg-white rounded-full transition-all", settings.visualFX ? "left-6" : "left-1")} />
                                </div>
                            </button>

                            <button 
                                onClick={() => onUpdateSettings('haptics', !settings.haptics)}
                                className="flex items-center justify-between w-full p-3 bg-slate-800 rounded-xl active:scale-95 transition-transform"
                            >
                                <div className="flex items-center gap-3">
                                    {settings.haptics ? <Gamepad2 className="w-5 h-5 text-purple-400" /> : <Gamepad2 className="w-5 h-5 text-slate-500" />}
                                    <span className="text-sm font-bold text-white">Haptics</span>
                                </div>
                                <div className={clsx("w-10 h-5 rounded-full relative transition-colors", settings.haptics ? "bg-purple-500" : "bg-slate-600")}>
                                    <div className={clsx("absolute top-1 w-3 h-3 bg-white rounded-full transition-all", settings.haptics ? "left-6" : "left-1")} />
                                </div>
                            </button>
                            
                            {/* Crates Submenu Button */}
                            <button 
                                onClick={() => setSettingsView('CRATES')}
                                className="flex items-center justify-between w-full p-3 bg-slate-800 rounded-xl active:scale-95 transition-transform"
                            >
                                <div className="flex items-center gap-3">
                                    <PackageOpen className="w-5 h-5 text-yellow-400" />
                                    <span className="text-sm font-bold text-white">Crates</span>
                                </div>
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Config &gt;</span>
                            </button>
                        </div>

                        <button 
                            onClick={onClose}
                            className="w-full py-3 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded-xl mt-4 active:scale-95 transition-transform"
                        >
                            CLOSE
                        </button>
                    </div>
                    </>
                ) : (
                    <>
                    <div className="flex items-center justify-between mb-6">
                        <button 
                            onClick={() => { setSettingsView('MAIN'); setSettingsError(null); setInfoModalCrate(null); }}
                            className="p-2 -ml-2 text-slate-400 hover:text-white transition-colors"
                        >
                            <ChevronLeft className="w-6 h-6" />
                        </button>
                        <h2 className="text-2xl font-black italic text-center text-white tracking-widest uppercase">
                            CRATES
                        </h2>
                        <div className="w-6" /> {/* Spacer */}
                    </div>

                    <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
                        <p className="text-xs text-slate-500 text-center mb-4">
                            Toggle effects. Tap <span className="inline-block align-middle"><Info className="w-3 h-3" /></span> for info.
                        </p>
                        
                        {settingsError && (
                            <div className="mb-4 p-2 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400 text-xs font-bold text-center animate-pulse">
                                {settingsError}
                            </div>
                        )}
                        
                        {crateTypes.map(type => (
                            <div 
                                key={type}
                                className="flex items-center justify-between w-full p-3 bg-slate-800 rounded-xl gap-2"
                            >
                                <div className="flex items-center gap-3 flex-1">
                                    {/* Info Icon Button */}
                                    <button 
                                        onClick={() => setInfoModalCrate(type)}
                                        className="p-1.5 bg-slate-700/50 hover:bg-slate-600 rounded-full text-cyan-400/80 hover:text-cyan-300 transition-colors"
                                    >
                                        <Info className="w-4 h-4" />
                                    </button>
                                    
                                    <span className={clsx("text-sm font-bold uppercase", settings.crateToggles[type] ? "text-white" : "text-slate-500")}>
                                        {CRATE_METADATA[type].label}
                                    </span>
                                </div>
                                
                                {/* Toggle Switch */}
                                <button 
                                    onClick={() => toggleCrate(type)}
                                    className={clsx("w-10 h-5 rounded-full relative transition-colors shrink-0", settings.crateToggles[type] ? "bg-green-500" : "bg-slate-600")}
                                >
                                    <div className={clsx("absolute top-1 w-3 h-3 bg-white rounded-full transition-all", settings.crateToggles[type] ? "left-6" : "left-1")} />
                                </button>
                            </div>
                        ))}
                    </div>
                    
                    <button 
                            onClick={() => { setSettingsView('MAIN'); setSettingsError(null); setInfoModalCrate(null); }}
                            className="w-full py-3 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded-xl mt-4 active:scale-95 transition-transform"
                    >
                        BACK
                    </button>
                    </>
                )}
            </div>
        </div>
    );
};

export default SettingsOverlay;