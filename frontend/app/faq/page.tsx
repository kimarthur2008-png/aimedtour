'use client';

import { useState } from 'react';
import { useLanguage } from '@/context/LanguageContext';

export default function FaqPage() {
  const { t } = useLanguage();
  const [open, setOpen] = useState<number | null>(null);
  const toggle = (i: number) => setOpen((prev) => (prev === i ? null : i));

  return (
    <div className="min-h-page" style={{ backgroundColor: '#DAEDFB' }}>
      <div className="max-w-[1280px] mx-auto px-6 py-16">

        {/* Hero */}
        <div className="flex items-center justify-between mb-14 gap-8">
          <h1
            className="text-h1 uppercase leading-tight"
            style={{ color: '#2E4A5A' }}
          >
            {t.faq.title.split(' ').slice(0, 1).join(' ')}<br />
            {t.faq.title.split(' ').slice(1).join(' ')}
          </h1>

          <div className="relative shrink-0 hidden md:block">
            <div
              className="absolute inset-0 rounded-full scale-110"
            />
            <img
              src="/images/faq.png"
              alt="Команда врачей"
              className="relative object-contain h-96 w-auto"
            />
          </div>
        </div>

        {/* Все вопросы — одна колонка */}
        <div className="flex flex-col gap-6">
          {t.faq.items.map((item, i) => (
            <FaqCard key={i} index={i} item={item} isOpen={open === i} onToggle={toggle} />
          ))}
        </div>

      </div>
    </div>
  );
}

interface FaqCardProps {
  index:    number;
  item:     { q: string; a: string };
  isOpen:   boolean;
  onToggle: (i: number) => void;
}

function FaqCard({ index, item, isOpen, onToggle }: FaqCardProps) {
  return (
    <div
      className="animate-slide-up rounded-2xl cursor-pointer select-none"
      style={{ backgroundColor: '#46707E40' }}
      onClick={() => onToggle(index)}
    >
      <div className="flex items-center justify-between px-7 py-6 gap-4">
        <span
          className="text-h4 uppercase font-semibold leading-snug"
          style={{ color: '#1A2E3B' }}
        >
          {item.q}
        </span>
        <svg
          width="22"
          height="22"
          viewBox="0 0 22 22"
          fill="none"
          className="shrink-0 transition-transform duration-300"
          style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', color: '#1A2E3B' }}
        >
          <path
            d="M5 8L11 14L17 8"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      <div
        className="grid transition-all duration-300 ease-in-out"
        style={{ gridTemplateRows: isOpen ? '1fr' : '0fr' }}
      >
        <div className="overflow-hidden">
          <div className="px-7 pb-5 text-body" style={{ color: '#2D4A5A' }}>
            {item.a}
          </div>
        </div>
      </div>
    </div>
  );
}
