# Prompt Log

## 2026-11-15: Build the first version of the self-assuredness survey

1. "SelfAssuredEval: build this project. Read SelfAssuredEval.md in this folder and build what it describes, following its META-INSTRUCTIONS exactly."

   This led to three rounds of questions, answered in the question widget:
   - Purpose: fun to share with friends, and a portfolio piece.
   - Construct: four parts (self-worth, handling things, speaking up, steadiness).
   - Items: validated scales (Rosenberg plus IPIP-NEO-120). The licences were checked first, and the General Self-Efficacy Scale was dropped because its terms only cover research use.
   - Format: one question per screen in the Editorial look (A), keeping each scale's native answer format.
   - Result: four bars plus an overall score. Reason given: credibility is the point.
   - Hosting: GitHub Pages, public.
   - Done criteria and deferrals confirmed.

   Then the build: the static site, the scoring tests, browser walkthroughs in light and dark at desktop and phone width, and a Lighthouse pass (accessibility 100). Fonts were self-hosted after Lighthouse flagged them, and the docs were written.

2. "Yes, publish"

   Created the public repo amalmehta/SelfAssured, pushed `main`, enabled GitHub Pages (served at https://amalmehta.com/SelfAssured/) with HTTPS enforced, and checked the live site.

3. "open latest"

   Opened the live site in the browser pane.

4. "there needs to be a neutral + more nuance to the options"

   Only the 10 Rosenberg questions lacked a neutral; the 12 IPIP questions already had 5 points. After checking studies of answer formats (Donnellan & Rakhshani 2023 favour 5 points for Rosenberg; 4 to 7 points give about the same reliability), the choice offered was 5 points for all or 7 points for all. Amal picked 5 points for all, so Rosenberg gained "Neither agree nor disagree".

5. "Yes, push"

6. "walk through the checklist"

   Checked the automatable items in the browser and asked about feel, Reduce Motion, phone and wording in the question widget; all passed. Fixed a stale "0 and 3 for Rosenberg" label in the scoring explanation.

7. "make sure it tracks over time"

   Asked in the question widget: history in this browser only (with export/import), opt-in saving from the results screen, an overall line plus a table of parts, and push the checklist fix right away. Built `js/history.js` with tests, the history screen and the "since your last saved result" box; tested at phone width, in dark mode, and with a malformed import.
