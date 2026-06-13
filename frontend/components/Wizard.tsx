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

// ── Category step ─────────────────────────────────────────────
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
                    className="flex flex-col items-center gap-2 p-5 rounded-2xl text-sm font-medium transition-all text-center hover:scale-[1.03] active:scale-[0.98]"
                    style={{
                        border:     selected === opt.label ? '1px solid #4C6D7C' : '1px solid #C8D5C2',
                        background: selected === opt.label ? 'rgba(76,109,124,0.08)' : '#fff',
                        color:      selected === opt.label ? '#21393B' : '#3D5A52',
                    }}
                >
                    <img src={opt.icon} alt="" className="w-8 h-8" />
                    <span>{tLabel(opt.label)}</span>
                </button>
            ))}

            <div className="relative" ref={ref}>
                <button
                    onClick={() => setOpen((v) => !v)}
                    className="w-full flex flex-col items-center gap-2 p-5 rounded-2xl text-sm font-medium transition-all text-center hover:scale-[1.03] active:scale-[0.98]"
                    style={{
                        border:     isOtherSelected ? '1px solid #4C6D7C' : '1px solid #C8D5C2',
                        background: isOtherSelected ? 'rgba(76,109,124,0.08)' : '#fff',
                        color:      isOtherSelected ? '#21393B' : '#3D5A52',
                    }}
                >
                    <span className="text-2xl">⋯</span>
                    <span className="flex items-center gap-1">
                        {isOtherSelected ? tLabel(selected) : other}
                        <svg className={`w-3 h-3 transition-transform ${open ? 'rotate-180' : ''}`}
                             fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                        </svg>
                    </span>
                </button>

                {open && (
                    <div className="absolute left-0 top-full mt-2 w-60 bg-white rounded-2xl shadow-lg z-50 overflow-hidden"
                         style={{ border: '1px solid #C8D5C2' }}>
                        <div className="px-4 py-2.5 text-xs font-semibold uppercase tracking-wide border-b"
                             style={{ color: '#6B8C7E', borderColor: '#E8EDE6' }}>
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

// ── Budget step ───────────────────────────────────────────────
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
    const animRef    = useRef<number | null>(null);
    const currentVal = useRef<number>(initialVal());

    function animateTo(target: number) {
        if (animRef.current) cancelAnimationFrame(animRef.current);
        const DURATION = 400;
        // eslint-disable-next-line react-hooks/purity
        const start = performance.now();
        const from  = currentVal.current;
        const tick  = (now: number) => {
            const elapsed  = now - start;
            const progress = Math.min(elapsed / DURATION, 1);
            const ease = progress < 0.5
                ? 4 * progress * progress * progress
                : 1 - Math.pow(-2 * progress + 2, 3) / 2;
            const current = Math.round(from + (target - from) * ease);
            currentVal.current = current;
            setSliderVal(current);
            if (progress < 1) animRef.current = requestAnimationFrame(tick);
            else { currentVal.current = target; setSliderVal(target); }
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
        const seg    = BUDGET_SEGMENTS.find((s) => s.label === label)!;
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
                  .budget-slider{-webkit-appearance:none;appearance:none;width:100%;height:4px;border-radius:2px;outline:none;cursor:pointer;background:linear-gradient(to right,#6B8B80 0%,#6B8B80 ${pct}%,#C8D5C2 ${pct}%,#C8D5C2 100%)}
                  .budget-slider::-webkit-slider-thumb{-webkit-appearance:none;appearance:none;width:22px;height:22px;border-radius:50%;background:#fff;border:2.5px solid #6B8B80;box-shadow:0 2px 6px rgba(0,0,0,0.15);cursor:pointer;transition:transform 0.15s}
                  .budget-slider::-webkit-slider-thumb:hover{transform:scale(1.15)}
                  .budget-slider::-moz-range-thumb{width:22px;height:22px;border-radius:50%;background:#fff;border:2.5px solid #6B8B80;box-shadow:0 2px 6px rgba(0,0,0,0.15);cursor:pointer}
                `}</style>
                <input type="range" min={SLIDER_MIN} max={SLIDER_MAX} step={500}
                       value={sliderVal} onChange={handleSlider} className="budget-slider" />
                <div className="flex justify-between mt-1">
                    <span className="text-xs" style={{ color: '#9BB5AC' }}>$500</span>
                    <span className="text-xs" style={{ color: '#9BB5AC' }}>$30,000+</span>
                </div>
            </div>
            <div className="grid grid-cols-2 gap-3 mt-6">
                {BUDGET_SEGMENTS.map((seg) => (
                    <button key={seg.label} onClick={() => handleSegment(seg.label)}
                            className="p-4 rounded-2xl text-sm font-medium transition-all text-center hover:scale-[1.03] active:scale-[0.98]"
                            style={{
                                border:     selected === seg.label ? '1px solid #4C6D7C' : '1px solid #C8D5C2',
                                background: selected === seg.label ? 'rgba(76,109,124,0.08)' : '#fff',
                                color:      selected === seg.label ? '#21393B' : '#3D5A52',
                            }}>
                        <div className="font-semibold">{tLabel(seg.label)}</div>
                    </button>
                ))}
            </div>
        </div>
    );
}

// ── Options grid ──────────────────────────────────────────────
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
                <button key={opt.label} onClick={() => onSelect(stepId, opt.label)}
                        className="flex flex-col items-center gap-2 p-5 rounded-2xl text-sm font-medium transition-all text-center hover:scale-[1.03] active:scale-[0.98]"
                        style={{
                            border:     selected === opt.label ? '1px solid #4C6D7C' : '1px solid #C8D5C2',
                            background: selected === opt.label ? 'rgba(76,109,124,0.08)' : '#fff',
                            color:      selected === opt.label ? '#21393B' : '#3D5A52',
                        }}>
                    <img src={opt.icon} alt="" className="w-8 h-8" />
                    <span>{tLabel(opt.label)}</span>
                </button>
            ))}
        </div>
    );
}

// ── Progress bar (top) ───────────────────────────────────────
function ProgressBar({ step, totalSteps, stepLabels }: { step: number; totalSteps: number; stepLabels: string[] }) {
    return (
        <div className="w-full max-w-3xl mx-auto mb-8 px-2">
            <div className="relative flex items-start justify-between">
                <div className="absolute top-5 left-0 right-0 h-px"
                     style={{ background: 'rgba(255,255,255,0.25)', zIndex: 0 }} />
                <div className="absolute top-5 left-0 h-px transition-all duration-700 ease-in-out"
                     style={{ width: step === 0 ? '0%' : `${(step / (totalSteps - 1)) * 100}%`, background: '#fff', zIndex: 1 }} />
                {Array.from({ length: totalSteps }).map((_, i) => {
                    const isDone    = i < step;
                    const isCurrent = i === step;
                    const isFuture  = i > step;
                    return (
                        <div key={i} className="relative flex flex-col items-center gap-2" style={{ zIndex: 2, width: 100 }}>
                            <div className="flex items-center justify-center rounded-full font-semibold select-none transition-all duration-500"
                                 style={{
                                     width:      isCurrent ? 44 : 38,
                                     height:     isCurrent ? 44 : 38,
                                     fontSize:   isCurrent ? 16 : 14,
                                     background: isFuture  ? '#fff' : '#6B8B80',
                                     color:      isFuture  ? '#6B8B80' : '#fff',
                                     border:     isFuture  ? '1.5px solid rgba(255,255,255,0.35)' : 'none',
                                     boxShadow:  isCurrent ? '0 0 0 6px rgba(255,255,255,0.15)' : 'none',
                                     marginTop:  isCurrent ? -3 : 0,
                                 }}>
                                {isDone ? '✓' : i + 1}
                            </div>
                            <span className="text-xs whitespace-nowrap transition-all duration-300 hidden sm:block"
                                  style={{ color: isFuture ? 'rgba(255,255,255,0.45)' : 'rgba(255,255,255,0.9)', fontWeight: isCurrent ? 500 : 400 }}>
                                {stepLabels[i]}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

// ── Sidebar step dots ─────────────────────────────────────────
function StepDots({ step, totalSteps }: { step: number; totalSteps: number }) {
    return (
        <div className="flex gap-1.5">
            {Array.from({ length: totalSteps }).map((_, i) => (
                <div key={i}
                     className="rounded-full transition-all duration-300"
                     style={{
                         width:           i === step ? 20 : 6,
                         height:          6,
                         backgroundColor: i <= step ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.25)',
                     }}
                />
            ))}
        </div>
    );
}

// ── Main Wizard ───────────────────────────────────────────────
export default function Wizard({ step, totalSteps, currentStep, answers, isLastStep, onSelect, onNext, onBack }: Props) {
    const { t } = useLanguage();
    const selected  = answers[currentStep.id] ?? '';
    const tLabel    = (key: string) => (t.wizard.optionLabels as Record<string, string>)[key] ?? key;
    const stepData  = t.wizard.steps[step];
    const sideTitle = stepData?.sideTitle ?? '';
    const sideDesc  = stepData?.sideDesc  ?? '';

    return (
        <div className="w-full flex flex-col items-center justify-center py-10 px-4"
             style={{ minHeight: 'calc(100vh - 76px)', background: '#C0CEB9', paddingBottom: '160px' }}>

            <ProgressBar step={step} totalSteps={totalSteps} stepLabels={t.wizard.stepLabels} />

            <div className="w-full max-w-3xl flex rounded-3xl shadow-2xl">

                {/* ── Left sidebar ── */}
                <div className="hidden md:flex w-64 shrink-0 flex-col justify-between px-7 py-8 rounded-l-3xl"
                     style={{ background: '#21393B' }}>

                    {/* Top: icon + text */}
                    <div>
                        {/* AI avatar */}
                        <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5"
                             style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={1.5} className="w-7 h-7">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23-.693L5 14.5m14.8.8l1.402 1.402c1 1 .03 2.798-1.414 2.798H4.212c-1.444 0-2.414-1.798-1.414-2.798L4.2 15.3" />
                            </svg>
                        </div>

                        <h3 className="text-white font-bold text-lg leading-snug mb-3"
                            style={{ fontStyle: 'italic' }}>
                            {sideTitle}
                        </h3>
                        <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.6)' }}>
                            &ldquo;{sideDesc}&rdquo;
                        </p>
                    </div>

                    {/* Bottom: step dots */}
                    <StepDots step={step} totalSteps={totalSteps} />
                </div>

                {/* ── Right content ── */}
                <div className="flex-1 bg-white flex flex-col px-8 py-8 min-w-0 rounded-r-3xl md:rounded-l-none rounded-l-3xl overflow-visible">

                    {/* Step counter */}
                    <p className="text-xs font-bold tracking-widest uppercase mb-3"
                       style={{ color: '#6B8B80' }}>
                        Question {step + 1} of {totalSteps}
                    </p>

                    {/* Question */}
                    <h2 className="text-xl font-semibold mb-1" style={{ color: '#1A2E2A' }}>
                        {stepData?.q ?? currentStep.q}
                    </h2>
                    <p className="text-sm mb-6" style={{ color: '#6B8C7E' }}>
                        {stepData?.sub ?? currentStep.sub}
                    </p>

                    {/* Options */}
                    <div className="flex-1">
                        {currentStep.isCategoryStep ? (
                            <CategoryStep stepId={currentStep.id} selected={selected} onSelect={onSelect}
                                          tLabel={tLabel} other={t.wizard.other} selectSpec={t.wizard.selectSpec} />
                        ) : currentStep.id === 'budget' ? (
                            <BudgetStep stepId={currentStep.id} selected={selected} onSelect={onSelect} tLabel={tLabel} />
                        ) : (
                            <OptionsGrid stepId={currentStep.id} options={currentStep.options ?? []}
                                         selected={selected} onSelect={onSelect} tLabel={tLabel} />
                        )}
                    </div>

                    {/* Divider + Nav */}
                    <div className="mt-8 pt-6 border-t flex items-center justify-between"
                         style={{ borderColor: '#E8EDE6' }}>
                        {step > 0 ? (
                            <button onClick={onBack} className="text-sm transition-colors"
                                    style={{ color: '#6B8C7E' }}>
                                {t.wizard.back}
                            </button>
                        ) : <span />}

                        <button
                            onClick={onNext}
                            disabled={!selected}
                            className="flex items-center gap-2 px-7 py-3 rounded-full text-sm font-medium transition-all duration-200 hover:brightness-110 disabled:cursor-not-allowed"
                            style={{
                                background: selected ? '#6B8B80' : 'rgba(107,139,128,0.15)',
                                color:      selected ? '#fff'    : '#6B8B80',
                                border:     selected ? 'none'    : '1px solid #6B8B80',
                            }}
                        >
                            {isLastStep ? t.wizard.finish : t.wizard.next} →
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
