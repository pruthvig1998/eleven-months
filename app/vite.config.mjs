// Lets the dev server read ../rules (the shared extractor and routing). `vite preview` sends the same
// Content-Security-Policy as Firebase Hosting (csp.txt), so the policy can be tested before a deploy.
import { readFileSync } from 'node:fs';
import react from '@vitejs/plugin-react';
const csp = readFileSync(new URL('./csp.txt', import.meta.url), 'utf8').trim();
export default { plugins: [react()], server: { fs: { allow: ['..'] } }, preview: { headers: { 'Content-Security-Policy': csp } } };
