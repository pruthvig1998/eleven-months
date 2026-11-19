# Demo recording script (target 2:55, hard limit 3:00)

The rules ask for a video that shows the project **working**, and the judges want to see both on-device and cloud inference. The entry video is: the first **4 seconds** of the trailer (`brag-output/brag.mp4`, logo and title only), then your own screen recording. Send me the recordings and I will join them, cut the waits, add the music credit and the chapter times, and check the length.

The story in one line: **before you sign** (the scan), **when you move out** (Deposit Shield), **what is really the law** (viral claims), and **wherever you read an agreement** (Chrome extension and Android app).

## Before you record
1. Close other heavy programs and plug in the laptop. A busy machine made the scan take over 3 minutes in tests.
2. Open desktop Chrome at https://eleven-months-nano.web.app. Press **Load sample**, then **Scan lease**, and wait for it to finish. This loads the model. Then reload the page. If the scan stalls on clause 1, restart Chrome (Gemini Nano sometimes gets stuck; a restart fixed it on 19 Nov).
3. Check the footer says "Source: Firebase Remote Config". If it says "built-in defaults", reload; if it still does, leave that shot out.
4. Have a phone photo of a printed page of English text ready on the laptop.
5. Copy the test clause below into a note, ready to paste at 1:03. Its names and numbers are made up.
6. Extension: reload Eleven Months in `chrome://extensions`. In a second tab, open https://github.com/pruthvig1998/eleven-months/blob/main/app/src/sample.ts (the sample agreement as a web page) for the right-click shot.
7. Android (optional): on the phone, open the installed Eleven Months app and record the screen with Android's own screen recorder (Quick Settings, Screen record) for about 10 seconds: the app opening full screen, Load sample, the clauses. Send me that clip separately.
8. The cloud steps (masked clause, drafts) use the free cloud quota. Record on a day you have not run big tests; the quota resets at 1:30 PM IST.
9. Set the browser zoom to 110%. Hide bookmarks and other tabs. Close the suggestion dialog if it is open.
10. Record with Cmd+Shift+5, "Record Selected Portion", around the browser window, microphone on. Keep recording through the slow stretches; I will cut them. Say each line only when the screen shows it.

Test clause for 1:03:

```
RENTAL AGREEMENT

2. The Lessee, Ms. Anitha Rao (phone 98480 12345, anitha.rao@example.com), has paid a security deposit equal to ten months' rent to Mr. Ravi Kumar Reddy (Aadhaar 1821 7365 9017, PAN ABCPM1234K), the monthly rent being Rs. 18,000. The Lessor may forfeit the entire deposit, without assigning any reason, if the Lessee vacates before the Lessor is satisfied with the condition of the flat.
```

## Shots and what to say

Times are for the finished video, after I cut the waits.

| Time | On screen | Say |
|---|---|---|
| 0:00 to 0:04 | (the trailer's logo and title, added by me) | nothing |
| 0:04 | The page top. Point at "On-device model: ready" | "Most rental agreements in India run for eleven months, and tenants sign them unread. Eleven Months reads it first, on my laptop, with Gemini Nano in Chrome, through Firebase AI Logic." |
| 0:17 | Press **Load sample**, then **Scan lease**. Point at the RULES and NANO tags | "Fixed rules read the numbers. The on-device model judges each clause. Nothing has left the laptop." |
| 0:32 | Scroll to the verdict: "6 of 11 clauses need attention." | "Six of eleven clauses need attention." |
| 0:38 | Clause 2: "Deposit is 10 months' rent", "Deposit can be forfeited", and the "Ask for this instead" box | "Ten months' deposit the owner can keep for any reason, and exactly what to ask for instead." |
| 0:50 | The CLOUD tag on Clause 2 or 3, then the scan summary: "Cloud calls" and "Stayed on device" | "A clause goes to cloud Gemini only when there's a reason, like the rules and the model disagreeing. Everything else stays here." |
| 1:03 | Select all in the agreement box, paste the test clause, **Scan lease**. Open "Sent to cloud (names and IDs masked)" | "Before anything is sent, names, Aadhaar, PAN, phones and emails are masked on the device. This is exactly what the cloud saw." |
| 1:20 | "Take this to the signing" sheet | "And a sheet to take to the signing." |
| 1:26 | **Upload PDF or photo**, pick the phone photo, the text appears | "A photo of the agreement is read on the device too. It never leaves the laptop." |
| 1:36 | Nav: **Deposit Shield**. **Load made-up example**, **Check deductions**. Scroll the table | "Moving out? Paste the landlord's deductions. Thirty-two thousand for AC servicing: not in your agreement. Each line is checked against your own contract." |
| 1:50 | **Write the two drafts**, then point at the ladder on the right | "It writes a firm message and a formal notice from masked facts, and shows the next steps if the money doesn't come back." |
| 2:02 | Nav: **Law or forward?** Point at "Model Tenancy Act proposal, not adopted here", then click **Karnataka** | "And the viral 'new rent rules': checked state by state, each with its source. Most of it is a model law Telangana never adopted." |
| 2:15 | Second tab (the sample agreement on GitHub). Highlight clause 8, right-click, **Check this clause with Eleven Months**. The side panel shows the result. Then click the **Full app** tab | "In Chrome, highlight any clause, right-click, and it's checked on the device. The full app is one tab away." |
| 2:32 | (Your phone clip, if recorded) | "And on Android, the same app installs from the web." |
| 2:40 | Footer line "Thresholds in use ... Source: Firebase Remote Config" | "Thresholds come from Remote Config, and App Check protects every cloud call." |
| 2:45 | Back to the top | "A screening aid, not legal advice. On 96 clauses it had never seen, it caught 67 of 70 harmful ones. Eleven Months: read all eleven months before you sign them." |

Notes:
- The number of clauses sent to the cloud in the sample can be 2 or 3 between runs, because the on-device model does not answer the same way every time. The script does not say a number.
- If the drafts show "plain templates" instead of "Written by cloud Gemini", the cloud quota is used up; record that shot another day or say "it writes a firm message and a formal notice" over the template.
- No Android clip? Cut the 2:32 line; the video ends at about 2:47.
- Do not switch the network off during the recording. That path has not been tested.
- If the 96-clause re-run (scheduled for 20 Nov) gives a different clean number, I will update the last line before you record.

## After recording
Send me the screen recording (and the phone clip). I will cut the waits, join it after the 4-second opening, keep the music under the opening only, add chapter times to the YouTube description in `SUBMISSION-DRAFT.md`, and check that it is under 3 minutes. Upload the result to YouTube as **Public**.
