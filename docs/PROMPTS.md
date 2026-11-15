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
