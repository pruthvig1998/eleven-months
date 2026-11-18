import fs from 'node:fs';
// dev-only: POST /save?name=x writes results/x.json so a page reload cannot lose measurements
export default { plugins: [{ name: 'save', configureServer(s) { s.middlewares.use('/save', (req, res) => { const n = new URL(req.url, 'http://x').searchParams.get('name').replace(/[^\w-]/g, ''); let b = ''; req.on('data', d => b += d); req.on('end', () => { fs.writeFileSync(`results/${n}.json`, b); res.end('ok'); }); }); } }] };
