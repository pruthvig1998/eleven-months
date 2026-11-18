// Builds the Chrome extension into extension/dist. envDir points at a folder with no .env files, so no Firebase
// project values (and no App Check) can reach the bundle; the side panel uses a placeholder config for on-device only.
import { fileURLToPath } from 'node:url';
const here = fileURLToPath(new URL('.', import.meta.url));
export default { root: here, envDir: here + 'no-env', base: './', server: { fs: { allow: ['..'] } }, build: { outDir: 'dist', emptyOutDir: true, modulePreload: false, rolldownOptions: { input: here + 'sidepanel.html' } } };
