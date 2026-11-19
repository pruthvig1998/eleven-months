# Eleven Months for Chrome (extension)

A Manifest V3 extension that checks a rental-agreement clause where you find it: on a listing page or in a document. (Selecting text in Chrome's own PDF viewer has not been tested yet; if the menu item does not appear there, copy the text into the side panel.)

Status: the side panel logic and the hand-off were tested as a page in a browser with no on-device model. The packaged extension has not yet been loaded in Chrome by a person, so the context menu and Gemini Nano inside the panel are not yet verified.

- **Scan this page**: open an agreement in a tab (a web page, or a document shown as a page), click the toolbar icon, press **Scan this page**. Or right-click anywhere on the page and choose **Scan this page with Eleven Months**. Up to 60 pieces are checked on the device; Full scan has no cap.
- **Open a PDF file**: for a PDF shown in a viewer (Chrome's own, or another extension's such as Adobe Acrobat), which Chrome does not let extensions read. Download the PDF and open it here; its text is read on the device with pdf.js. Scanned PDFs have no text layer: use Full scan, which reads page images in the web app.
- **Side panel**: click the toolbar icon, paste a clause or a whole agreement, press **Check on this device**.
- **Context menu**: select text on any page, right-click, choose **Check this clause with Eleven Months**. The side panel opens and checks the selection.
- **Full app tab**: the Eleven Months web app inside the side panel, with everything it does: the full scan with the masked cloud second opinion, photos and scanned PDFs, whole-agreement checks, the signing sheet, Deposit Shield, "Law, or viral forward?", guides and law notes. **Full scan in the app** moves the text you checked into it.

## What runs where, and why the extension's own code never calls the cloud

The **On this device** tab runs the same fixed rules (`rules/`) and the same Gemini Nano prompts (`app/src/prompts.ts`) as the web app, through the Firebase AI Logic Web SDK in `ONLY_ON_DEVICE` mode. **Its code makes no cloud calls. This is deliberate.** The web app's cloud second opinion is protected by Firebase App Check with reCAPTCHA Enterprise, and the reCAPTCHA flow does not run in extension pages. Rather than ship an unprotected cloud path, the extension's own pages keep everything on the device. The **Full app** tab shows the web app itself in a frame: that page is the live site (its own origin, https://eleven-months-nano.web.app), so its cloud calls run under App Check exactly as on the site, with names and ID numbers masked first. The site allows itself to be framed only by Chrome extension pages (`frame-ancestors chrome-extension:`), and the frame is given `language-model` so Gemini Nano can run inside it.

How this is enforced, not just promised:
- The build reads no `.env` file (`envDir` points at an empty folder), so no Firebase project values reach the bundle. It uses a placeholder config, which is enough for on-device inference. A check of the built bundle found no `recaptcha` and no `AIza` API key.
- The manifest's Content Security Policy sets `connect-src 'self'`, so the browser blocks any network request from the extension's own pages; `frame-src` allows only the Eleven Months site, for the Full app tab.
- No host permissions. The permissions are `sidePanel`, `contextMenus`, `storage` (the selected text, in session storage only), and `activeTab` with `scripting`, which let it read the text of the one tab you clicked on, only after that click. It cannot read other tabs or pages in the background.
- Pages Chrome does not let extensions read (a PDF in a viewer, the Web Store, `chrome://` pages) get a message saying so, pointing to **Open a PDF file** or the right-click item.
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
