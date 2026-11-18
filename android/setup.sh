#!/bin/sh
# Builds the Android app (Trusted Web Activity) with Bubblewrap. Run from the repository root: sh android/setup.sh
# The signing key lives OUTSIDE the repository, in ~/.eleven-months-keys/. You type its passwords yourself; this
# script never stores them. Bubblewrap downloads a JDK 17 and the Android SDK into ~/.bubblewrap on first use.
set -e
KEYDIR="$HOME/.eleven-months-keys"; KEY="$KEYDIR/android.keystore"
mkdir -p "$KEYDIR"; chmod 700 "$KEYDIR"
if [ ! -f "$KEY" ]; then
  echo "Creating the signing key. Choose a password and keep it safe; losing it means you cannot update the app."
  keytool -genkeypair -v -keystore "$KEY" -alias eleven-months -keyalg RSA -keysize 2048 -validity 10000 -dname "CN=Eleven Months, O=Eleven Months, C=IN"
fi
sed "s#KEYSTORE_PATH#$KEY#" android/twa-manifest.template.json > android/twa-manifest.json
cd android
npx --yes @bubblewrap/cli@1.27.0 update --skipVersionUpgrade --manifest=./twa-manifest.json
npx --yes @bubblewrap/cli@1.27.0 build --manifest=./twa-manifest.json
cd ..
# Digital Asset Links: proves to Chrome that the site and the app belong together, so the app opens without a URL bar.
FP=$(keytool -list -v -keystore "$KEY" -alias eleven-months | awk '/SHA256:/ {print $2; exit}')
mkdir -p app/public/.well-known
printf '[{"relation":["delegate_permission/common.handle_all_urls"],"target":{"namespace":"android_app","package_name":"app.web.eleven_months_nano.twa","sha256_cert_fingerprints":["%s"]}}]\n' "$FP" > app/public/.well-known/assetlinks.json
echo "Done. APK: android/app-release-signed.apk  AAB: android/app-release-bundle.aab"
echo "assetlinks.json written to app/public/.well-known/. Deploy the site so Chrome can verify it."
