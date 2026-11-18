// Motion layer: Lenis smooth scrolling, a GSAP headline reveal, a looping demo of one clause being checked,
// and one scroll-driven moment (how a clause is routed). Everything is off under prefers-reduced-motion,
// and the page reads the same without any of it.
import Lenis from 'lenis';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';

gsap.registerPlugin(ScrollTrigger, SplitText);
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const EASE = 'expo.out';

// Smooth scrolling, also for in-page links.
let lenis: Lenis | null = null;
if (!reduced) {
  lenis = new Lenis({ duration: 1.05, smoothWheel: true });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add(t => lenis!.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
}
document.addEventListener('click', e => {
  const a = (e.target as HTMLElement).closest('a[href^="#"]') as HTMLAnchorElement | null;
  const id = a?.getAttribute('href')?.slice(1);
  const target = id ? document.getElementById(id) : null;
  if (!target || a!.dataset.q) return;
  e.preventDefault();
  if (lenis) lenis.scrollTo(target, { offset: -16 }); else target.scrollIntoView();
  (target.querySelector('textarea, input, button') as HTMLElement | null)?.focus({ preventScroll: true });
});
// Scrolling to new results during a scan: let Lenis follow native scrolls.
export const scrollToEl = (el: Element) => (lenis ? lenis.scrollTo(el as HTMLElement, { offset: -80 }) : el.scrollIntoView({ block: 'nearest' }));

if (!reduced) {
  // Headline: words rise into place once, on load.
  document.fonts.ready.then(() => {
    const h1 = document.querySelector('.hero h1');
    if (h1) {
      const split = SplitText.create(h1, { type: 'words', mask: 'words' });
      gsap.from(split.words, { yPercent: 110, duration: 1.1, ease: EASE, stagger: 0.06 });
    }
    gsap.from('.hero .sub, .hero .cta-row', { opacity: 0, y: 16, duration: 0.9, ease: EASE, delay: 0.35, stagger: 0.08 });
    gsap.from('.demo', { opacity: 0, y: 28, rotate: 1.5, duration: 1.1, ease: EASE, delay: 0.2 });
  });

  // The demo card: the risky words get marked, the stamp lands, the ask appears; repeats.
  const demo = gsap.timeline({ repeat: -1, repeatDelay: 1.2, delay: 1.4 });
  demo.set('.demo .mark', { backgroundSize: '0% 100%' }).set('.demo .stamp', { opacity: 0, scale: 1.4 }).set('.demo .demo-ask', { opacity: 0, y: 10 }).set('.demo .demo-scan', { scaleX: 0 })
    .to('.demo .demo-scan', { scaleX: 1, duration: 1, ease: 'power2.inOut' })
    .to('.demo .mark', { backgroundSize: '100% 100%', duration: 0.6, ease: EASE }, '-=0.2')
    .to('.demo .stamp', { opacity: 1, scale: 1, duration: 0.28, ease: 'back.out(2.2)' }, '+=0.1')
    .to('.demo .demo-ask', { opacity: 1, y: 0, duration: 0.5, ease: EASE }, '+=0.2')
    .to({}, { duration: 2.6 })
    .to('.demo .demo-ask, .demo .stamp', { opacity: 0, duration: 0.3 })
    .to('.demo .mark', { backgroundSize: '0% 100%', duration: 0.3 }, '<');

  // The one scroll moment: a clause travels the route, step by step, while the section is pinned.
  const how = document.querySelector('.how');
  if (how && innerWidth > 820) {
    const tl = gsap.timeline({ scrollTrigger: { trigger: how, start: 'top top', end: '+=1400', scrub: 0.6, pin: true } });
    tl.from('.how .step', { opacity: 0.25, stagger: 0.5, duration: 0.5 })
      .fromTo('.how .route-dot', { left: '0%' }, { left: '100%', ease: 'none', duration: 1.5 }, 0)
      .from('.how .proof', { opacity: 0, y: 20, duration: 0.4 }, '>-0.2');
  }
}
