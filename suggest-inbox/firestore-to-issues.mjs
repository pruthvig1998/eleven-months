// Daily job: turns new Firestore suggestions into GitHub issues, then deletes them from Firestore.
// Env: FIREBASE_SA (service-account JSON), GITHUB_TOKEN and GITHUB_REPOSITORY (provided by Actions).
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
const db = getFirestore(initializeApp({ credential: cert(JSON.parse(process.env.FIREBASE_SA)) }));
const snap = await db.collection('suggestions').orderBy('createdAt').limit(50).get();
for (const doc of snap.docs) {
  const { bucket, text, source } = doc.data();
  const title = `[${bucket}] ${String(text).replace(/\s+/g, ' ').slice(0, 70)}${text.length > 70 ? '…' : ''}`;
  const r = await fetch(`https://api.github.com/repos/${process.env.GITHUB_REPOSITORY}/issues`, { method: 'POST', headers: { authorization: `Bearer ${process.env.GITHUB_TOKEN}`, accept: 'application/vnd.github+json' }, body: JSON.stringify({ title, body: `${text}\n\n**Source:** ${source || 'none given'}\n\n_Sent through the website (Firestore). Not reviewed yet._`, labels: ['inbox', `bucket: ${bucket}`] }) });
  if (!r.ok) { console.error(`GitHub refused ${doc.id}: ${r.status}`); process.exitCode = 1; continue; }
  await doc.ref.delete();
}
console.log(`Filed ${snap.size} suggestion(s).`);
