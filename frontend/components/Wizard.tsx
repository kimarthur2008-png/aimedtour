'use client';

import { useState, useRef, useEffect } from 'react';
import type { WizardStep, WizardAnswers } from '@/hooks/useWizard';
import { CATEGORY_PRIMARY, CATEGORY_OTHER } from '@/hooks/useWizard';
import { useLanguage } from '@/context/LanguageContext';

interface Props {
    step: number;
    totalSteps: number;
    currentStep: WizardStep;
    answers: WizardAnswers;
    isLastStep: boolean;
    onSelect: (stepId: string, label: string) => void;
    onNext: () => void;
    onBack: () => void;
}

function ProgressBar({ step, totalSteps, stepLabels }: { step: number; totalSteps: number; stepLabels: string[] }) {
    return (
        <div className="w-full max-w-xl mx-auto mb-10 px-2">
            <div className="relative flex items-start justify-between">

                {/* Фоновая линия */}
                <div
                    className="absolute top-5 left-0 right-0 h-px"
                    style={{ background: 'rgba(255,255,255,0.25)', zIndex: 0 }}
                />

                {/* Анимированная заполненная линия */}
                <div
                    className="absolute top-5 left-0 h-px transition-all duration-700 ease-in-out"
                    style={{
                        width: step === 0 ? '0%' : `${(step / (totalSteps - 1)) * 100}%`,
                        background: '#fff',
                        zIndex: 1,
                    }}
                />

                {Array.from({ length: totalSteps }).map((_, i) => {
                    const isDone    = i < step;
                    const isCurrent = i === step;
                    const isFuture  = i > step;

                    return (
                        <div key={i} className="relative flex flex-col items-center gap-2" style={{ zIndex: 2, width: 100 }}>
                            <div
                                className="flex items-center justify-center rounded-full font-semibold select-none transition-all duration-500"
                                style={{
                                    width:      isCurrent ? 44 : 38,
                                    height:     isCurrent ? 44 : 38,
                                    fontSize:   isCurrent ? 16 : 14,
                                    background: isFuture ? '#fff' : '#6B8B80',
                                    color:      isFuture ? '#6B8B80' : '#fff',
                                    border:     isFuture ? '1.5px solid rgba(255,255,255,0.35)' : 'none',
                                    boxShadow:  isCurrent ? '0 0 0 6px rgba(255,255,255,0.15)' : 'none',
                                    marginTop:  isCurrent ? -3 : 0,
                                }}
                            >
                                {isDone ? '✓' : i + 1}
                            </div>
                            <span
                                className="text-xs whitespace-nowrap transition-all duration-300 hidden sm:block"
                                style={{
                                    color:      isFuture ? 'rgba(255,255,255,0.45)' : 'rgba(255,255,255,0.9)',
                                    fontWeight: isCurrent ? 500 : 400,
                                }}
                            >
                {stepLabels[i]}
              </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

function CategoryStep({ stepId, selected, onSelect, tLabel, other, selectSpec }: {
    stepId: string;
    selected: string;
    onSelect: (id: string, label: string) => void;
    tLabel: (key: string) => string;
    other: string;
    selectSpec: string;
}) {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);
    const isOtherSelected = selected && !CATEGORY_PRIMARY.some((p) => p.label === selected);

    useEffect(() => {
        function handler(e: MouseEvent) {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        }
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    return (
        <div className="grid grid-cols-2 gap-3">
            {CATEGORY_PRIMARY.map((opt) => (
                <button
                    key={opt.label}
                    onClick={() => { onSelect(stepId, opt.label); setOpen(false); }}
                    className={`hover:bg-[#3d5a52] focus:bg-[#3d5a52]/20 transition-colors duration-200 flex flex-col items-center gap-2 p-5 rounded-2xl text-sm font-medium transition-all text-center ${
                        selected === opt.label ? 'bg-[rgba(76,109,124,0.08)]' : 'bg-white'
                    }`}
                    style={{
                        border: selected === opt.label ? '...' : '...',
                        color: selected === opt.label ? '#21393B' : '#3D5A52',
                    }}
                >
                    <img src={opt.icon} alt="" className="w-8 h-8" />
                    <span>{tLabel(opt.label)}</span>
                </button>
            ))}

            <div className="relative" ref={ref}>
                <button
                    onClick={() => setOpen((v) => !v)}
                    className="w-full flex flex-col items-center gap-2 p-5 rounded-2xl text-sm font-medium transition-all text-center"
                    style={{
                        border:     isOtherSelected ? '2px solid #4C6D7C' : '1.5px solid #C8D5C2',
                        background: isOtherSelected ? 'rgba(76,109,124,0.08)' : '#fff',
                        color:      isOtherSelected ? '#21393B' : '#3D5A52',
                    }}
                >
                    <span className="text-2xl">⋯</span>
                    <span className="flex items-center gap-1">
            {isOtherSelected ? tLabel(selected) : other}
                        <svg
                            className={`w-3 h-3 transition-transform ${open ? 'rotate-180' : ''}`}
                            fill="none" stroke="currentColor" viewBox="0 0 24 24"
                        >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
            </svg>
          </span>
                </button>

                {open && (
                    <div
                        className="absolute left-0 top-full mt-2 w-60 bg-white rounded-2xl shadow-lg z-50 overflow-hidden"
                        style={{ border: '1px solid #C8D5C2' }}
                    >
                        <div
                            className="px-4 py-2.5 text-xs font-semibold uppercase tracking-wide border-b"
                            style={{ color: '#6B8C7E', borderColor: '#E8EDE6' }}
                        >
                            {selectSpec}
                        </div>
                        <div className="max-h-64 overflow-y-auto">
                            {CATEGORY_OTHER.map((opt) => (
                                <button
                                    key={opt.label}
                                    onClick={() => { onSelect(stepId, opt.label); setOpen(false); }}
                                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left transition-colors"
                                    style={{
                                        background: selected === opt.label ? 'rgba(76,109,124,0.08)' : 'transparent',
                                        color:      selected === opt.label ? '#21393B' : '#3D5A52',
                                        fontWeight: selected === opt.label ? 500 : 400,
                                    }}
                                >
                                    <img src={opt.icon} alt="" className="w-5 h-5 shrink-0" />
                                    <span className="flex-1">{tLabel(opt.label)}</span>
                                    {selected === opt.label && <span style={{ color: '#4C6D7C' }}>✓</span>}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}


const BUDGET_SEGMENTS = [
    { label: 'До $5,000',         min: 500,   max: 5000  },
    { label: '$5,000 — $15,000',  min: 5000,  max: 15000 },
    { label: '$15,000 — $30,000', min: 15000, max: 30000 },
    { label: 'Свыше $30,000',     min: 30000, max: 50000 },
];
const SLIDER_MIN = 500;
const SLIDER_MAX = 50000;

function sliderToSegment(val: number): string {
    if (val <= 5000)  return 'До $5,000';
    if (val <= 15000) return '$5,000 — $15,000';
    if (val <= 30000) return '$15,000 — $30,000';
    return 'Свыше $30,000';
}

function formatSliderValue(val: number): string {
    if (val >= 50000) return '$30,000+';
    return '$' + val.toLocaleString('en-US');
}

function BudgetStep({ stepId, selected, onSelect, tLabel }: {
    stepId: string;
    selected: string;
    onSelect: (id: string, label: string) => void;
    tLabel: (key: string) => string;
}) {
    const initialVal = () => {
        if (selected === 'До $5,000')          return 2500;
        if (selected === '$5,000 — $15,000')   return 10000;
        if (selected === '$15,000 — $30,000')  return 22000;
        if (selected === 'Свыше $30,000')      return 40000;
        return 5000;
    };
    const [sliderVal, setSliderVal] = useState(initialVal);
    const animRef   = useRef<number | null>(null);
    const currentVal = useRef<number>(initialVal());

    function animateTo(target: number) {
        if (animRef.current) cancelAnimationFrame(animRef.current);
        const DURATION = 400;
        const start = performance.now();
        const from = currentVal.current;

        const tick = (now: number) => {
            const elapsed = now - start;
            const progress = Math.min(elapsed / DURATION, 1);
            const ease = progress < 0.5
                ? 4 * progress * progress * progress
                : 1 - Math.pow(-2 * progress + 2, 3) / 2;
            const current = Math.round(from + (target - from) * ease);
            currentVal.current = current;
            setSliderVal(current);
            if (progress < 1) {
                animRef.current = requestAnimationFrame(tick);
            } else {
                currentVal.current = target;
                setSliderVal(target);
            }
        };
        animRef.current = requestAnimationFrame(tick);
    }

    useEffect(() => () => { if (animRef.current) cancelAnimationFrame(animRef.current); }, []);

    function handleSlider(e: React.ChangeEvent<HTMLInputElement>) {
        if (animRef.current) cancelAnimationFrame(animRef.current);
        const val = Number(e.target.value);
        currentVal.current = val;
        setSliderVal(val);
        onSelect(stepId, sliderToSegment(val));
    }

    function handleSegment(label: string) {
        const seg = BUDGET_SEGMENTS.find((s) => s.label === label)!;
        const target = label === 'Свыше $30,000' ? 40000 : Math.round((seg.min + seg.max) / 2);
        animateTo(target);
        onSelect(stepId, label);
    }

    const pct = ((sliderVal - SLIDER_MIN) / (SLIDER_MAX - SLIDER_MIN)) * 100;

    return (
        <div>
            <div className="text-center mb-6">
        <span className="text-3xl font-bold" style={{ color: '#4C6D7C' }}>
          {formatSliderValue(sliderVal)}
        </span>
            </div>

            <div className="relative mb-2 px-1">
                <style>{`
          .budget-slider { -webkit-appearance: none; appearance: none; width: 100%; height: 4px; border-radius: 2px; outline: none; cursor: pointer; background: linear-gradient(to right, #6B8B80 0%, #6B8B80 ${pct}%, #C8D5C2 ${pct}%, #C8D5C2 100%); }
          .budget-slider::-webkit-slider-thumb { -webkit-appearance: none; appearance: none; width: 22px; height: 22px; border-radius: 50%; background: #fff; border: 2.5px solid #6B8B80; box-shadow: 0 2px 6px rgba(0,0,0,0.15); cursor: pointer; transition: transform 0.15s; }
          .budget-slider::-webkit-slider-thumb:hover { transform: scale(1.15); }
          .budget-slider::-moz-range-thumb { width: 22px; height: 22px; border-radius: 50%; background: #fff; border: 2.5px solid #6B8B80; box-shadow: 0 2px 6px rgba(0,0,0,0.15); cursor: pointer; }
        `}</style>
                <input
                    type="range"
                    min={SLIDER_MIN}
                    max={SLIDER_MAX}
                    step={500}
                    value={sliderVal}
                    onChange={handleSlider}
                    className="budget-slider"
                />
                <div className="flex justify-between mt-1">
                    <span className="text-xs" style={{ color: '#9BB5AC' }}>$500</span>
                    <span className="text-xs" style={{ color: '#9BB5AC' }}>$30,000+</span>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-6">
                {BUDGET_SEGMENTS.map((seg) => (
                    <button
                        key={seg.label}
                        onClick={() => handleSegment(seg.label)}
                        className="p-4 rounded-2xl text-sm font-medium transition-all text-center"
                        style={{
                            border:     selected === seg.label ? '2px solid #4C6D7C' : '1.5px solid #C8D5C2',
                            background: selected === seg.label ? 'rgba(76,109,124,0.08)' : '#fff',
                            color:      selected === seg.label ? '#21393B' : '#3D5A52',
                        }}
                    >
                        <div className="font-semibold">{tLabel(seg.label)}</div>
                    </button>
                ))}
            </div>
        </div>
    );
}

function OptionsGrid({ stepId, options, selected, onSelect, tLabel }: {
    stepId: string;
    options: { icon: string; label: string }[];
    selected: string;
    onSelect: (id: string, label: string) => void;
    tLabel: (key: string) => string;
}) {
    return (
        <div className="grid grid-cols-2 gap-3">
            {options.map((opt) => (
                <button
                    key={opt.label}
                    onClick={() => onSelect(stepId, opt.label)}
                    className="flex flex-col items-center gap-2 p-5 rounded-2xl text-sm font-medium transition-all text-center"
                    style={{
                        border:     selected === opt.label ? '2px solid #4C6D7C' : '1.5px solid #C8D5C2',
                        background: selected === opt.label ? 'rgba(76,109,124,0.08)' : '#fff',
                        color:      selected === opt.label ? '#21393B' : '#3D5A52',
                    }}
                >
                    <img src={opt.icon} alt="" className="w-8 h-8" />
                    <span>{tLabel(opt.label)}</span>
                </button>
            ))}
        </div>
    );
}

export default function Wizard({
                                   step, totalSteps, currentStep, answers, isLastStep,
                                   onSelect, onNext, onBack,
                               }: Props) {
    const { t } = useLanguage();
    const selected = answers[currentStep.id] ?? '';
    const tLabel = (key: string) =>
        (t.wizard.optionLabels as Record<string, string>)[key] ?? key;

    return (
        <div
            className="min-h-screen w-full flex flex-col items-center py-12 px-4"
            style={{ background: '#C0CEB9' }}
        >
            <ProgressBar step={step} totalSteps={totalSteps} stepLabels={t.wizard.stepLabels} />

            {/* Карточка */}
            <div className="w-full max-w-xl bg-white rounded-3xl p-8 shadow-lg">
                <h2 className="text-xl font-semibold mb-1" style={{ color: '#1A2E2A' }}>
                    {t.wizard.steps[step]?.q ?? currentStep.q}
                </h2>
                <p className="text-sm mb-6" style={{ color: '#6B8C7E' }}>
                    {t.wizard.steps[step]?.sub ?? currentStep.sub}
                </p>

                {currentStep.isCategoryStep ? (
                    <CategoryStep
                        stepId={currentStep.id}
                        selected={selected}
                        onSelect={onSelect}
                        tLabel={tLabel}
                        other={t.wizard.other}
                        selectSpec={t.wizard.selectSpec}
                    />
                ) : currentStep.id === 'budget' ? (
                    <BudgetStep
                        stepId={currentStep.id}
                        selected={selected}
                        onSelect={onSelect}
                        tLabel={tLabel}
                    />
                ) : (
                    <OptionsGrid
                        stepId={currentStep.id}
                        options={currentStep.options ?? []}
                        selected={selected}
                        onSelect={onSelect}
                        tLabel={tLabel}
                    />
                )}

                <div className="mt-8 mb-6 h-px" style={{ background: '#E8EDE6' }} />

                <div className="flex items-center justify-between">
                    {step > 0 ? (
                        <button
                            onClick={onBack}
                            className="text-sm transition-colors"
                            style={{ color: '#6B8C7E' }}
                        >
                            {t.wizard.back}
                        </button>
                    ) : <span />}

                    <button
                        onClick={onNext}
                        disabled={!selected}
                        className="hover:brightness-[1.15] focus:brightness-[1.15] transition-[filter] duration-200 flex items-center gap-2 px-7 py-3 rounded-full text-sm font-medium transition-all duration-200"
                        style={{
                            background: selected ? '#6B8B80' : 'rgba(255,255,255,.5)',
                            border: selected?  '1px solid rgba(255,255,255,.5)' : '1px solid #6B8B80',
                            color:      selected ? '#fff' : '#6B8B80',
                            cursor:     selected ? 'pointer' : 'not-allowed',
                        }}
                    >
                        {isLastStep ? t.wizard.finish : t.wizard.next} →
                    </button>
                </div>
            </div>
        </div>
    );
}