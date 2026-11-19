# Android app (Trusted Web Activity)

**Android app (Trusted Web Activity): the same web app, running in Chrome on Android.**

A Trusted Web Activity opens the live site (https://eleven-months-nano.web.app) full screen inside Chrome, with no address bar, as an installable app. It has no code of its own: what it can do is what Chrome on Android can do.

Honest limit: **Chrome on Android does not yet support the on-device model** (Chrome's own documentation lists Chrome for Android as not supported by the built-in AI APIs). So on Android the app runs the fixed rules on the phone and offers the opt-in cloud check, where ID numbers, phones, emails and names written after a title are masked by pattern before sending, and the page says so before you tick it. The full hybrid engine (rules, then Gemini Nano, then masked cloud only on a trigger) runs in desktop Chrome and in the Chrome extension (on-device part only).

Checked on 19 Nov 2026: the APK installs on a real Android phone and opens full screen with no address bar, so the Digital Asset Links check passes. A full scan on the phone was not part of that check.

## Install (for judges)

Download [`docs/downloads/eleven-months-android.apk`](../docs/downloads/eleven-months-android.apk) on an Android phone (Android 7.0 or newer), allow installs from unknown sources when asked, and open **Eleven Months**.

## Build

```bash
sh android/setup.sh
```

The script:
1. creates the signing key in `~/.eleven-months-keys/android.keystore`, outside this repository (you type its passwords; they are not stored anywhere by the script);
2. runs Bubblewrap (`@bubblewrap/cli`), which on first use downloads a JDK 17 and the Android SDK into `~/.bubblewrap`;
3. builds `android/app-release-signed.apk` (install on a phone) and `android/app-release-bundle.aab` (Play Store format);
4. writes `app/public/.well-known/assetlinks.json` with the key's SHA-256 fingerprint. Deploy the site after this, so Chrome can verify that the site and the app belong together. Until then the app opens with a URL bar.

Never commit the keystore. `.gitignore` excludes `*.keystore`, `*.jks` and everything generated in this folder.
