# Instructions

## Run it locally

ES modules don't load from `file://`, so serve the folder over HTTP:

```bash
python3 -m http.server 8743 --bind 127.0.0.1
```

Then open http://localhost:8743.

## Test

```bash
npm test
```

This runs Node's built-in test runner on `tests/scoring.test.mjs` (11 tests: item counts, reverse keys, extremes, the steadiness flip, the overall average, missing answers, and the plain-words descriptions). It needs no npm install.

## Use

- **Start:** click Start or press Enter.
- **Answer:** click or tap an option, or press 1–4 (Rosenberg) or 1–5 (IPIP). It moves on by itself.
- **Back:** press ← or click Back. Earlier answers are kept.
- **Results:** open any part to see what it measures, what it doesn't, its reliability, and each statement next to your answer.
- **Save image** downloads a PNG of your result card. **Retake** starts over.
- **Settings:** the gear icon or ⌘, (Ctrl+, on Windows/Linux). It covers theme and motion, and says what's stored.

## Deploy (GitHub Pages)

Under the repo's Settings → Pages, choose to deploy from the `main` branch, `/ (root)` folder. There is no build step.

## Manual review checklist

What automated tests can't check. Walk through it on a real phone and a laptop.

**Feel and smoothness**
- [ ] The opening animation feels quick and calm (under a second) and never blocks pressing Start.
- [ ] Each answer highlights instantly, and the move to the next question feels deliberate, not laggy.
- [ ] Going back slides the other way, with no flicker or jump in the layout.
- [ ] The result bars and the count-up feel satisfying, not slow.
- [ ] With Reduce Motion on (macOS: Accessibility → Display), everything fades and nothing slides or springs.

**Look**
- [ ] Light and dark both feel warm and quiet, including the settings dialog and the share image.
- [ ] Questions are comfortably readable on a phone, and the equation in "How the scores are worked out" reads well in dark mode.
- [ ] The icon is recognisable in a browser tab and on a phone home screen.

**Words**
- [ ] Nothing reads as a diagnosis, and a low score feels handled kindly.
- [ ] Every number says what it means; the "not compared to other people" line is visible.

**Privacy and security**
- [ ] DevTools → Network during a full run shows only same-origin requests.
- [ ] DevTools → Application → Local Storage holds only `sa-settings` (theme and motion), and "Delete saved settings" clears it.
- [ ] No answers or scores appear in the URL at any point.

**Live**
- [ ] The GitHub Pages URL loads over HTTPS, and the Feedback link opens a new issue.
