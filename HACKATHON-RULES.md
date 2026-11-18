# Firebase hybrid AI hackathon: rules that matter for this entry

Read on 18 Nov 2026 from the official Devpost site, https://firebasehybridaihackathon.devpost.com/ (overview, `/rules`, FAQ and updates pages; the resources page was not opened). This is a working summary. The official pages win if they differ.

## Dates
- Submission period: 11 Nov 2026, 1:30 PM Pacific, to 30 Nov 2026, 2:00 PM Pacific. The deadline is fixed; commits pushed after it are not evaluated.
- Judging: 10 to 16 Dec 2026. Winners on or around 21 Dec 2026.

## Who can enter
- India is not on the excluded list (eligibility is by residence). Entrants must be above the age of majority.
- Individuals, teams or organisations. Not open to Google or Devpost staff and their households, or government employees.

## What the project must do
- A generative AI app built with Firebase AI Logic, with supported Firebase products such as App Check, Remote Config, Firestore and Authentication.
- At least one platform. Web (Chrome) means Gemini Nano through Firebase AI Logic. Multi-platform is preferred.
- All AI inference goes through Firebase AI Logic; no direct calls to other model APIs. Judges want to see both on-device and cloud inference.
- App Check is required; debug tokens are accepted in submissions.
- The app must support English.
- An existing project must be significantly updated during the submission period, with pre-existing code disclosed and a summary of what was built in the period.

## What must be submitted
- Text: how Firebase AI Logic is used, features and functionality, value proposition.
- A public GitHub or GitLab repository with an open source licence file that GitHub detects and shows in the About section (Apache preferred). It must contain all source, assets and run instructions, and show Firebase AI Logic imported and called.
- A video of at most 3 minutes, public on YouTube, in English or with English subtitles, showing the project working.
- A working demo URL is strongly encouraged, not required. It must stay free and available until judging ends.

## Prizes (USD 30,000)
Grand 10,000; first runner-up 7,000; second runner-up 4,000; Best iOS, Best Android and Best Web/Chrome 3,000 each.

## Judging
Stage 1 is pass or fail on the requirements. Stage 2 scores four equally weighted criteria from 1 to 5: technological implementation (including hybrid inference), design, potential impact, quality of the idea.

## Things that disqualify
- A missing required item, a private repository, no licence file, a video that is not public, or Firebase AI Logic not called at runtime.
- Production API keys, live project secrets, App Check debug tokens, `.env` files or personal data in the repository or the submission.
- Third-party logos, trademarks or content used without rights. The rules do not mention music specifically, so the general rule applies: use only music you hold the rights to.

## Where this entry stands (18 Nov 2026)
| Requirement | State |
|---|---|
| Firebase AI Logic for all inference, on-device and cloud | Met (`app/src/ai.ts`) |
| App Check | Met (reCAPTCHA Enterprise in production) |
| Public repository with licence | This repository, Apache-2.0 |
| No secrets or personal data in the repository | `.env.local` is ignored; test data is synthetic |
| Video, 3 minutes or less, public on YouTube | Video exists (40 s). Not uploaded. Its music track has no documented licence and should be replaced or removed first |
| Working demo URL | https://eleven-months-nano.web.app |
| Summary of what was built in the period | In the README |
| Second platform (Android or iOS) | Not built |
