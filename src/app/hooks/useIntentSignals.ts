import { useEffect, useRef, useState } from 'react';

const INITIAL_ENGAGEMENT_LEVEL = 0.45;
const MAX_MAGNETISM_DISTANCE = 170;
const INTERSECTION_THRESHOLD_MIN = 0.35;
const INTERSECTION_THRESHOLD_MAX = 0.6;
const DEEP_ENGAGEMENT_THRESHOLD = 0.62;

type AdaptiveLabels = {
  publications: string;
  systems: string;
  notes: string;
};

const defaultLabels: AdaptiveLabels = {
  publications: 'Publications',
  systems: 'Systems',
  notes: 'Notes',
};

export function useIntentSignals(sectionIds: string[]) {
  const [engagementLevel, setEngagementLevel] = useState(INITIAL_ENGAGEMENT_LEVEL);
  const [adaptiveLabels, setAdaptiveLabels] = useState<AdaptiveLabels>(defaultLabels);
  const engagementRef = useRef(engagementLevel);
  const revisitRef = useRef(0);
  const velocityRef = useRef(0);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const root = document.documentElement;
    const setVar = (name: string, value: string) => root.style.setProperty(name, value);

    setVar('--breathing-space', '1');
    setVar('--motion-blur', '0px');
    setVar('--focus-clarity', '1');
    setVar('--density-level', '1');
    setVar('--cursor-velocity', '0');
    setVar('--gravity-pull', '0');
    setVar('--predictive-reveal', '0');
    setVar('--ambient-energy', '0.35');
    setVar('--engagement-level', engagementLevel.toFixed(3));
    setVar('--cursor-x', '50%');
    setVar('--cursor-y', '50%');

    let lastY = window.scrollY;
    let lastTime = performance.now();
    let smoothedVelocity = 0;
    let lastVelocity = 0;
    let pauseTimeout: number | null = null;

    let pointerState = { x: window.innerWidth / 2, y: window.innerHeight / 2, t: performance.now() };
    let smoothedPointerVelocity = 0;
    let magnetTarget: HTMLElement | null = null;

    const decayTimers = new Map<HTMLElement, number>();
    const visitedCounts = new Map<string, number>();
    const targets = Array.from(document.querySelectorAll<HTMLElement>('[data-intent-target]'));

    const refreshEngagement = (scrollFocus: number) => {
      const combined = Math.min(
        1,
        Math.max(0, 0.25 + (1 - scrollFocus) * 0.4 + revisitRef.current * 0.45)
      );
      setVar('--engagement-level', combined.toFixed(3));
      if (Math.abs(combined - engagementRef.current) > 0.03) {
        engagementRef.current = combined;
        setEngagementLevel(combined);
      }
    };

    const handleScroll = () => {
      const now = performance.now();
      const dy = Math.abs(window.scrollY - lastY);
      const dt = now - lastTime || 1;
      const velocity = dy / dt;
      smoothedVelocity = smoothedVelocity * 0.85 + velocity * 0.15;
      const normalized = Math.min(smoothedVelocity / 1.4, 1);
      const decelerating = velocity < lastVelocity * 0.7;

      const blurBase = Math.min(smoothedVelocity * 5, 6);
      const blur = decelerating ? blurBase * 0.45 : blurBase;
      setVar('--motion-blur', `${blur.toFixed(2)}px`);

      const clarity = Math.max(0.65, 1 - normalized * 0.55);
      setVar('--focus-clarity', clarity.toFixed(3));
      const breathing = 0.96 + (1 - normalized) * 0.08;
      setVar('--breathing-space', breathing.toFixed(3));
      const density = 0.92 + normalized * 0.18;
      setVar('--density-level', density.toFixed(3));
      const energy = 0.35 + normalized * 0.55;
      setVar('--ambient-energy', energy.toFixed(3));
      const predictive = decelerating ? 0.06 + (1 - normalized) * 0.04 : 0.02;
      setVar('--predictive-reveal', predictive.toFixed(3));

      velocityRef.current = normalized;

      if (pauseTimeout) window.clearTimeout(pauseTimeout);
      pauseTimeout = window.setTimeout(() => {
        setVar('--motion-blur', '0px');
        setVar('--focus-clarity', '1');
        setVar('--predictive-reveal', '0.08');
      }, 160);

      lastY = window.scrollY;
      lastTime = now;
      lastVelocity = velocity;
      refreshEngagement(normalized);
    };

    const setRecent = (el: HTMLElement) => {
      el.dataset.recent = 'true';
      const previous = decayTimers.get(el);
      if (previous) window.clearTimeout(previous);
      const timeout = window.setTimeout(() => {
        delete el.dataset.recent;
      }, 1800);
      decayTimers.set(el, timeout);
    };

    const echoMap = new Map<string, HTMLElement[]>();
    const handleTargetEnter = (event: Event) => {
      const current = event.currentTarget as HTMLElement;
      setRecent(current);
      const group = current.getAttribute('data-attention-group');
      if (group) {
        const grouped = targets.filter(
          (el) => el !== current && el.getAttribute('data-attention-group') === group
        );
        echoMap.set(group, grouped);
        grouped.forEach((el) => {
          el.dataset.echo = 'true';
        });
      }
    };

    const handleTargetLeave = (event: Event) => {
      const current = event.currentTarget as HTMLElement;
      const group = current.getAttribute('data-attention-group');
      if (group && echoMap.has(group)) {
        echoMap.get(group)?.forEach((el) => {
          delete el.dataset.echo;
        });
      }
    };

    const handlePointerMove = (event: PointerEvent) => {
      const now = performance.now();
      const dx = event.clientX - pointerState.x;
      const dy = event.clientY - pointerState.y;
      const dt = now - pointerState.t || 1;
      const velocity = Math.hypot(dx, dy) / dt;
      smoothedPointerVelocity = smoothedPointerVelocity * 0.8 + velocity * 0.2;
      const normalized = Math.min(smoothedPointerVelocity / 1.6, 1);
      setVar('--cursor-velocity', normalized.toFixed(3));
      setVar('--cursor-x', `${event.clientX}px`);
      setVar('--cursor-y', `${event.clientY}px`);

      let nearest: HTMLElement | null = null;
      let best = Infinity;
      for (const el of targets) {
        const rect = el.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const dist = Math.hypot(cx - event.clientX, cy - event.clientY);
        if (dist < best) {
          best = dist;
          nearest = el;
        }
      }

      if (nearest && best < MAX_MAGNETISM_DISTANCE) {
        const pull = 1 - best / MAX_MAGNETISM_DISTANCE;
        if (magnetTarget && magnetTarget !== nearest) {
          magnetTarget.classList.remove('is-magnetized');
          magnetTarget.style.removeProperty('--magnet-pull');
        }
        magnetTarget = nearest;
        nearest.classList.add('is-magnetized');
        nearest.style.setProperty('--magnet-pull', pull.toFixed(3));
        setVar('--gravity-pull', pull.toFixed(3));
      } else if (magnetTarget) {
        magnetTarget.classList.remove('is-magnetized');
        magnetTarget.style.removeProperty('--magnet-pull');
        magnetTarget = null;
        setVar('--gravity-pull', '0');
      }

      pointerState = { x: event.clientX, y: event.clientY, t: now };
    };

    const handleRecentClick = (event: Event) => setRecent(event.currentTarget as HTMLElement);

    targets.forEach((el) => {
      el.addEventListener('pointerenter', handleTargetEnter);
      el.addEventListener('pointerleave', handleTargetLeave);
      el.addEventListener('click', handleRecentClick);
    });

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const target = entry.target as HTMLElement;
          const id = target.dataset.sectionId || target.id;
          if (!id) return;
          if (entry.isIntersecting && entry.intersectionRatio > 0.35) {
            const prevCount = visitedCounts.get(id) ?? 0;
            const nextCount = prevCount + 1;
            visitedCounts.set(id, nextCount);
            if (nextCount > 1) {
              target.classList.add('is-revisited');
            }
          }
        });
        const revisited = Array.from(visitedCounts.values()).filter((v) => v > 1).length;
        revisitRef.current = sectionIds.length ? revisited / sectionIds.length : 0;
        refreshEngagement(velocityRef.current);
      },
      { threshold: [INTERSECTION_THRESHOLD_MIN, INTERSECTION_THRESHOLD_MAX] }
    );

    const sectionElements = sectionIds
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => Boolean(el));

    sectionElements.forEach((el) => observer.observe(el));

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('pointermove', handlePointerMove);
      if (pauseTimeout) window.clearTimeout(pauseTimeout);
      sectionElements.forEach((el) => observer.unobserve(el));
      observer.disconnect();
      targets.forEach((el) => {
        el.removeEventListener('pointerenter', handleTargetEnter);
        el.removeEventListener('pointerleave', handleTargetLeave);
        el.removeEventListener('click', handleRecentClick);
      });
      decayTimers.forEach((timeout) => window.clearTimeout(timeout));
    };
  }, [sectionIds]);

  useEffect(() => {
    const deepEngagement = engagementLevel > DEEP_ENGAGEMENT_THRESHOLD;
    document.documentElement.style.setProperty('--tempo-shift', deepEngagement ? '1.2' : '1');
    setAdaptiveLabels(
      deepEngagement
        ? {
            publications: 'Key Papers',
            systems: 'Relevant Work',
            notes: 'Technical Breakdown',
          }
        : defaultLabels
    );
  }, [engagementLevel]);

  return { adaptiveLabels, engagementLevel };
}
