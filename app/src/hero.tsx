// The hero's moving background: React Bits "Threads", mounted as a small React island.
// It pauses while a scan runs (the on-device model needs the GPU) and when motion is reduced.
import { createRoot } from 'react-dom/client';
import { useEffect, useState } from 'react';
import Threads from './vendor/react-bits/Threads.tsx';

const reduced = matchMedia('(prefers-reduced-motion: reduce)');

function HeroThreads() {
  const [paused, setPaused] = useState(reduced.matches);
  useEffect(() => {
    const sync = () => setPaused(reduced.matches || document.body.dataset.scanning === 'true');
    const mo = new MutationObserver(sync);
    mo.observe(document.body, { attributes: true, attributeFilter: ['data-scanning'] });
    reduced.addEventListener('change', sync);
    return () => { mo.disconnect(); reduced.removeEventListener('change', sync); };
  }, []);
  return <Threads color={[0.05, 0.42, 0.31]} accentColor={[0.83, 0.33, 0.2]} amplitude={1.4} distance={0.35} lineCount={60} thickness={0.55} speed={0.35} angle={-12} brightness={1.1} opacity={0.55} taper={0.9} paused={paused} />;
}

const el = document.getElementById('heroBg');
if (el && 'WebGL2RenderingContext' in self) createRoot(el).render(<HeroThreads />);
