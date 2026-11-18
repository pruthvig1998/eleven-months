# Eleven Months for Chrome (extension)

A Manifest V3 extension that checks a rental-agreement clause where you find it: on a listing page, in a document, or in a PDF open in Chrome.

- **Side panel**: click the toolbar icon, paste a clause or a whole agreement, press **Check on this device**.
- **Context menu**: select text on any page, right-click, choose **Check this clause with Eleven Months**. The side panel opens and checks the selection.
- **Full scan in Eleven Months**: opens the web app with the text already in the agreement box.

## What runs where, and why the extension never calls the cloud

The extension runs the same fixed rules (`rules/`) and the same Gemini Nano prompts (`app/src/prompts.ts`) as the web app, through the Firebase AI Logic Web SDK in `ONLY_ON_DEVICE` mode. **It makes no cloud calls. This is deliberate.** The web app's cloud second opinion is protected by Firebase App Check with reCAPTCHA Enterprise, and the reCAPTCHA flow does not run in extension pages. Rather than ship an unprotected cloud path, the extension keeps everything on the device. A clause that would need a second opinion is marked. **Full scan in Eleven Months** hands the text to the web app, where names and ID numbers are masked before a clause goes to cloud Gemini under App Check.

How this is enforced, not just promised:
- The build reads no `.env` file (`envDir` points at an empty folder), so no Firebase project values reach the bundle. It uses a placeholder config, which is enough for on-device inference. A check of the built bundle found no `recaptcha` and no `AIza` API key.
- The manifest's Content Security Policy sets `connect-src 'self'`, so the browser itself blocks any network request from the side panel.
- No host permissions. The only permissions are `sidePanel`, `contextMenus` and `storage`. `storage` holds the selected text for the panel in session storage only.
- The hand-off puts the text in the URL **fragment** (`#lease=...`). Browsers do not send a fragment to the server. The web app moves the text into the agreement box and removes it from the address bar. Nothing is scanned until you press **Scan lease**.

No on-device model (for example Chrome without Gemini Nano)? The panel says "rules only" and runs the fixed rules alone.

## Install (for judges)

1. Download [`docs/downloads/eleven-months-extension.zip`](../docs/downloads/eleven-months-extension.zip) and unzip it.
2. Open `chrome://extensions`, switch on **Developer mode**, press **Load unpacked**, and choose the unzipped folder.
3. Select a clause on any page, right-click, and choose **Check this clause with Eleven Months**.

Needs desktop Chrome 138 or newer. Gemini Nano downloads once, as for the web app.

## Build

From the repository root, after `npm install` in `app/` (the extension uses the app's packages through a `node_modules` link):

```bash
ln -sfn ../app/node_modules extension/node_modules
app/node_modules/.bin/vite build --config extension/vite.config.mjs
```

The output is in `extension/dist`.
