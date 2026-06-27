'use client';

import React, { CSSProperties } from 'react';
import { useReveal } from '@/hooks/useReveal';

const TRANSITION_FADE = (d: number) => `opacity 0.6s ease ${d}ms`;
const TRANSITION_UP   = (d: number) => `opacity 0.55s ease ${d}ms, transform 0.55s cubic-bezier(0.16, 1, 0.3, 1) ${d}ms`;

type RevealType = 'fade' | 'up';

interface Props {
  type?:      RevealType;
  delay?:     number;
  threshold?: number;
  className?: string;
  children?:  React.ReactNode;
  style?:     CSSProperties;
}

export function Reveal({ type = 'fade', delay = 0, threshold, className, children, style }: Props) {
  const { ref, visible } = useReveal(threshold);

  const revealStyle: CSSProperties = {
    opacity:   visible ? 1 : 0,
    transform: type === 'up' ? (visible ? 'translateY(0)' : 'translateY(32px)') : undefined,
    transition: visible
      ? (type === 'up' ? TRANSITION_UP(delay) : TRANSITION_FADE(delay))
      : undefined,
    ...style,
  };

  return (
    <div ref={ref} className={className} style={revealStyle}>
      {children}
    </div>
  );
}
