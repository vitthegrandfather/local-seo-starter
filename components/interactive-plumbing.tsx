'use client';

import Image from 'next/image';
import { useEffect, useId, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react';
import { Icon } from './icon';
import type { PlumbingScene } from '@/lib/plumbing-scene';
import { interactiveArt } from '@/content/interactive-art';
import styles from './interactive-plumbing.module.css';

type Drag = {
  pointerId: number;
  startX: number;
  startY: number;
  startOpening: number;
  travel: number;
  dragging: boolean;
};

export function InteractivePlumbing() {
  const [opening, setOpening] = useState(0);
  const [announcedPercentage, setAnnouncedPercentage] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [mode, setMode] = useState<'poster' | 'loading' | 'webgl' | 'fallback'>('poster');
  const root = useRef<HTMLElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const engine = useRef<PlumbingScene | null>(null);
  const alive = useRef(true);
  const requested = useRef(false);
  const selectedOpening = useRef(0);
  const publishFrame = useRef(0);
  const drag = useRef<Drag | null>(null);
  const paused = useRef(false);
  const id = useId();
  const percentage = Math.round(opening * 100);
  const open = opening > 0;

  async function activate() {
    if (requested.current) return;
    requested.current = true;
    setMode('loading');
    try {
      const { createPlumbingScene } = await import('@/lib/plumbing-scene');
      if (!alive.current || !canvas.current) return;
      engine.current = createPlumbingScene(canvas.current, () => {
        if (alive.current) setMode('fallback');
      });
      engine.current.setOpening(selectedOpening.current);
      engine.current.setPaused(paused.current);
      setMode('webgl');
    } catch {
      if (alive.current) setMode('fallback');
    }
  }

  function selectOpening(value: number) {
    selectedOpening.current = Math.max(0, Math.min(1, value));
    engine.current?.setOpening(selectedOpening.current);
    // Pointer events may arrive faster than screen refresh. Publish the latest
    // percentage once per frame without rebuilding the WebGL scene.
    if (!publishFrame.current) {
      publishFrame.current = requestAnimationFrame(() => {
        publishFrame.current = 0;
        if (!alive.current) return;
        setOpening(selectedOpening.current);
      });
    }
  }

  function announceSelection() {
    setAnnouncedPercentage(Math.round(selectedOpening.current * 100));
  }

  function adjustWithKeyboard(event: KeyboardEvent<HTMLDivElement>) {
    const changes: Record<string, number> = {
      ArrowRight: selectedOpening.current + 0.05,
      ArrowUp: selectedOpening.current + 0.05,
      ArrowLeft: selectedOpening.current - 0.05,
      ArrowDown: selectedOpening.current - 0.05,
      Home: 0,
      End: 1,
    };
    if (!(event.key in changes)) return;
    event.preventDefault();
    selectOpening(changes[event.key]);
    announceSelection();
    void activate();
  }

  function startDrag(event: PointerEvent<HTMLDivElement>) {
    if (event.button !== 0 || !event.isPrimary || drag.current) return;
    drag.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      startOpening: selectedOpening.current,
      travel: event.currentTarget.getBoundingClientRect().width * 0.3,
      dragging: false,
    };
    event.currentTarget.focus({ preventScroll: true });
    event.currentTarget.setPointerCapture(event.pointerId);
    void activate();
  }

  function moveDrag(event: PointerEvent<HTMLDivElement>) {
    const gesture = drag.current;
    if (!gesture || gesture.pointerId !== event.pointerId) return;
    const dx = event.clientX - gesture.startX;
    const dy = event.clientY - gesture.startY;
    if (!gesture.dragging) {
      if (Math.abs(dx) < 6 || Math.abs(dy) > Math.abs(dx)) return;
      gesture.dragging = true;
      setDragging(true);
    }
    selectOpening(gesture.startOpening + dx / gesture.travel);
  }

  function finishDrag(event: PointerEvent<HTMLDivElement>) {
    const gesture = drag.current;
    if (!gesture || gesture.pointerId !== event.pointerId) return;
    drag.current = null;
    if (gesture.dragging) setDragging(false);
    announceSelection();
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }

  useEffect(() => {
    alive.current = true;
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    let inView = true;
    function sync() {
      paused.current = document.hidden || !inView;
      engine.current?.setReducedMotion(reduced.matches);
      engine.current?.setPaused(paused.current);
    }
    const observer = new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting;
      sync();
    });
    if (root.current) observer.observe(root.current);
    document.addEventListener('visibilitychange', sync);
    reduced.addEventListener('change', sync);
    return () => {
      alive.current = false;
      observer.disconnect();
      document.removeEventListener('visibilitychange', sync);
      reduced.removeEventListener('change', sync);
      cancelAnimationFrame(publishFrame.current);
      publishFrame.current = 0;
      drag.current = null;
      engine.current?.dispose();
      engine.current = null;
      requested.current = false;
    };
  }, []);

  const status =
    announcedPercentage === 0
      ? interactiveArt.closedStatus
      : announcedPercentage === 100
        ? interactiveArt.openStatus
        : `${interactiveArt.partialStatus} ${announcedPercentage}%`;

  return (
    <figure
      ref={root}
      className={styles.art}
      data-testid="interactive-plumbing"
      data-open={open}
      data-renderer={mode}
    >
      <div
        role="slider"
        tabIndex={0}
        className={styles.control}
        data-dragging={dragging}
        aria-label={interactiveArt.openingLabel}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percentage}
        aria-valuetext={`${percentage}%`}
        aria-describedby={`${id}-hint`}
        onKeyDown={adjustWithKeyboard}
        onPointerDown={startDrag}
        onPointerMove={moveDrag}
        onPointerUp={finishDrag}
        onPointerCancel={finishDrag}
        onLostPointerCapture={finishDrag}
        onPointerEnter={() => void activate()}
        onFocus={() => void activate()}
      >
        <span className={styles.scene} data-testid="plumbing-scene">
          <Image
            className={styles.poster}
            src={open ? '/images/plumbing-3d-open.webp' : '/images/plumbing-3d-closed.webp'}
            alt=""
            width={900}
            height={900}
            preload={!open}
            unoptimized
            draggable={false}
          />
          <canvas ref={canvas} className={styles.canvas} aria-hidden="true" />
        </span>
      </div>
      <figcaption className={styles.caption} id={`${id}-hint`}>
        <Icon name="arrow" />
        <span>{interactiveArt.dragHint}</span>
      </figcaption>
      <span role="status" aria-live="polite" className="sr-only">
        {status}
      </span>
    </figure>
  );
}
