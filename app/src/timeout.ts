// Gives up on a call that does not answer in time. Gemini Nano was seen to stall for over 30 minutes on one clause
// (19 Nov 2026); with this, a stalled clause counts as "on-device answer unusable" and gets the cloud second opinion.
export class TimeoutError extends Error {}
export function withTimeout<T>(start: (signal: AbortSignal) => Promise<T>, ms: number, what: string): Promise<T> {
  const ac = new AbortController();
  let timer: ReturnType<typeof setTimeout> | undefined;
  const late = new Promise<never>((_, reject) => {
    timer = setTimeout(() => { ac.abort(); reject(new TimeoutError(`${what} gave no answer in ${Math.round(ms / 1000)} s`)); }, ms);
  });
  return Promise.race([start(ac.signal), late]).finally(() => clearTimeout(timer));
}
