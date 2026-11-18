# Demo recording script (target 2:40, hard limit 3:00)

The rules ask for a video that shows the project **working**, and the judges want to see both on-device and cloud inference. The 40-second animated trailer (`brag-output/brag.mp4`) is not enough on its own: it shows no cloud second opinion, and its "What you can check" screen (4.3 s to 21.3 s) still says "Not yet: scanned photos", which is out of date.

So the entry video is: the first **4 seconds** of the trailer (logo and title only), then your own screen recording of the live app. Send me the recording and I will join the two, cut the waits, add the music credit and the chapter times, and check the length.

## Before you record
1. Close other heavy programs and plug in the laptop. A busy machine made the scan take over 3 minutes in tests.
2. Open desktop Chrome at https://eleven-months-nano.web.app. Press **Load sample**, then **Scan lease**, and wait for it to finish. This loads the model. Then reload the page.
3. Have a phone photo of a printed page of English text ready on the laptop (or print the sample and photograph it).
4. Copy the test clause below into a note, ready to paste at 1:40. Its names and numbers are made up.
5. Set the browser zoom to 110% so text is readable in the video. Hide bookmarks and other tabs. Close the suggestion dialog if it is open.
6. Record with Cmd+Shift+5, "Record Selected Portion", around the browser window, microphone on.
7. The scan has slow stretches. Keep recording; I will cut the waiting out. Say each line only when the screen shows it.

Test clause for 1:40:

```
RENTAL AGREEMENT

2. The Lessee, Ms. Anitha Rao (phone 98480 12345, anitha.rao@example.com), has paid a security deposit equal to ten months' rent to Mr. Ravi Kumar Reddy (Aadhaar 1821 7365 9017, PAN ABCPM1234K), the monthly rent being Rs. 18,000. The Lessor may forfeit the entire deposit, without assigning any reason, if the Lessee vacates before the Lessor is satisfied with the condition of the flat.
```

## Shots and what to say

Times are for the finished video, after I cut the waits.

| Time | On screen | Say |
|---|---|---|
| 0:00 to 0:04 | (the trailer's logo and title, added by me) | nothing |
| 0:04 | The page top. Point at "On-device model: ready" | "Most rental agreements in India run for eleven months, and tenants sign them without anyone reading them. Eleven Months reads it first, on my laptop, with Gemini Nano built into Chrome, through Firebase AI Logic." |
| 0:20 | Press **Load sample**, then **Scan lease**. Cards appear one by one; point at the RULES and NANO tags | "Fixed rules read the numbers first. Then the on-device model judges each clause. So far, nothing has left the laptop." |
| 0:40 | Scroll to the verdict: "6 of 11 clauses need attention." | "Six of eleven clauses need attention." |
| 0:48 | Scroll to Clause 2. Point at "Deposit is 10 months' rent", "Deposit can be forfeited", and the "Ask for this instead" box | "A deposit of ten months' rent that the owner can keep for any reason. It tells me exactly what to ask for instead." |
| 1:05 | Point at the CLOUD tag lit on Clause 2 or 3, then at the scan summary: "Cloud calls" and "Stayed on device" | "A clause goes to cloud Gemini only when there's a reason: the rules are unsure, the rules and the on-device model disagree, or the model says it's fine while a rule found a problem. Everything else stays here." |
| 1:20 | Scroll to "Whole agreement" | "It also checks the agreement as a whole: here, no address for the flat and no length of tenancy." |
| 1:30 | Scroll to "Take this to the signing". Press **Print or save as PDF**, then cancel the print dialog | "And it ends with a sheet I can take to the signing." |
| 1:40 | Click in the agreement box, select all, paste the test clause, press **Scan lease**. When it finishes, open "Sent to cloud (names and IDs masked)" | "Before anything is sent, names, Aadhaar, PAN, phone numbers and emails are masked on the device. This is exactly what the cloud saw. If the names check fails, the clause isn't sent at all." |
| 2:05 | Press **Upload PDF or photo** and pick the phone photo. Wait for the text to appear | "Most tenants get the agreement as a photo. The on-device model reads it, and a second reader checks every word, so a skipped line is caught. The photo never leaves the laptop." |
| 2:25 | Open **Get help** and click "The deposit is not returned" | "Step-by-step help for common problems, each step showing its source." |
| 2:32 | Scroll to the footer line "Thresholds in use ... Source: Firebase Remote Config" | "The thresholds come from Firebase Remote Config, and App Check protects every cloud call." |
| 2:40 | Back to the top | "A screening aid, not legal advice. On 96 clauses it had never seen, it caught 67 of 70 harmful ones. Eleven Months: read all eleven months before you sign them." |

Notes:
- The number of clauses sent to the cloud in the sample can be 2 or 3 between runs, because the on-device model does not answer the same way every time. The script does not say a number, so either is fine.
- If the footer says "Source: built-in defaults", Remote Config did not load; reload the page before recording that shot.
- Do not switch the network off during the recording. That path has not been tested.

## After recording
Send me the file. I will cut the waits, join it after the 4-second opening, keep the music under the opening only, add chapter times to the YouTube description in `SUBMISSION-DRAFT.md`, and check that it is under 3 minutes. Upload the result to YouTube as **Public**.
