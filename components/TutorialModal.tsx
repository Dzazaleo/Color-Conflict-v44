
import React from 'react';
import { Check } from 'lucide-react';
import { PowerUpType } from '../types';
import { CRATE_METADATA } from '../constants';
import { CrateVisual } from './Obstacle';
import clsx from 'clsx';

interface TutorialModalProps {
    effect: PowerUpType;
    onContinue: () => void;
}

const TutorialModal: React.FC<TutorialModalProps> = ({ effect, onContinue }) => {
    const data = CRATE_METADATA[effect];
    const steps = data.tutorial || ["Hit the crate.", "Survive the effect.", "Score bonus points."];

    return (
        <div className="absolute inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-6 animate-in fade-in duration-300">
            <div className="bg-slate-900 border-2 border-slate-700 rounded-2xl p-6 shadow-2xl max-w-sm w-full flex flex-col items-center gap-6 relative">
                
                {/* Header with Visual */}
                <div className="flex flex-col items-center gap-4 w-full border-b border-slate-800 pb-6">
                    <div className="scale-125">
                         <CrateVisual effect={effect} visualFX={true} />
                    </div>
                    <div className="text-center">
                        <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">TUTORIAL</div>
                        <h2 className="text-3xl font-black text-white uppercase tracking-tighter drop-shadow-lg">
                            {data.label} <span className="text-cyan-400">CRATE</span>
                        </h2>
                    </div>
                </div>

                {/* Steps */}
                <div className="w-full space-y-3">
                    {steps.map((step, index) => (
                        <div key={index} className="flex items-start gap-3 bg-slate-800/50 p-3 rounded-lg border border-slate-700/50">
                            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-400 font-bold text-xs border border-cyan-500/50 shrink-0 mt-0.5">
                                {index + 1}
                            </div>
                            <p className="text-sm text-slate-200 font-medium leading-tight">
                                {step}
                            </p>
                        </div>
                    ))}
                </div>

                {/* Footer Button */}
                <button 
                    onClick={onContinue}
                    className="w-full py-3.5 bg-cyan-500 hover:bg-cyan-400 text-slate-900 font-black uppercase tracking-widest rounded-xl transition-all shadow-[0_0_20px_rgba(6,182,212,0.4)] hover:shadow-[0_0_30px_rgba(6,182,212,0.6)] active:scale-95 flex items-center justify-center gap-2"
                >
                    <span>Continue</span>
                    <Check className="w-5 h-5" />
                </button>
            </div>
        </div>
    );
};

export default TutorialModal;
