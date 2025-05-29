'use client';

import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

type TypewriterProps = {
  phrases: string[];
  typeSpeed?: number;
  deleteSpeed?: number;
  pauseTime?: number;
  className?: string;
};

export function Typewriter({
  phrases,
  typeSpeed = 50,
  deleteSpeed = 30,
  pauseTime = 1000,
  className,
}: TypewriterProps) {
  const [displayedText, setDisplayedText] = useState('');
  const [currentPhraseIndex, setCurrentPhraseIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    const currentPhrase = phrases[currentPhraseIndex];
    
    if (isPaused) {
      timeoutRef.current = setTimeout(() => {
        setIsPaused(false);
        setIsDeleting(true);
      }, pauseTime);
      return;
    }

    if (isDeleting) {
      if (displayedText === '') {
        setIsDeleting(false);
        setCurrentPhraseIndex((prev) => (prev + 1) % phrases.length);
        return;
      }
      timeoutRef.current = setTimeout(() => {
        setDisplayedText((prev) => prev.slice(0, -1));
      }, deleteSpeed);
    } else {
      if (displayedText === currentPhrase) {
        setIsPaused(true);
        setIsTyping(false);
        return;
      }
      setIsTyping(true);
      timeoutRef.current = setTimeout(() => {
        setDisplayedText((prev) => currentPhrase.slice(0, prev.length + 1));
      }, typeSpeed);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [displayedText, currentPhraseIndex, isDeleting, isPaused, phrases, typeSpeed, deleteSpeed, pauseTime]);

  return (
    <span className={cn('inline-block', className)}>
      {displayedText}
      <span className={cn('inline-block', !isTyping && 'animate-blink-caret')}>|</span>
    </span>
  );
} 