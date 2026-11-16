# File Structure

```
index.html            The whole page: intro, question, switch card, results, history, settings dialog, icon sprites
styles.css            Colour tokens (light and dark), self-hosted fonts, layout, motion
js/
  items.js            The 22 items, word for word, with keying, answer labels and citations
  scoring.js          Pure scoring functions (no DOM), shared by the page and the tests
  history.js          Saved scores over time: save, load, compare, export, import (no DOM)
  app.js              Screens, keyboard, transitions, results, history chart, share image, settings
tests/
  scoring.test.mjs    Unit tests for scoring (run with: npm test)
  history.test.mjs    Unit tests for saved history
assets/
  icon.svg            The app icon (also the favicon)
  icon-180.png        Apple touch icon
  icon-512.png        Large icon for docs and sharing
  fonts/              Inter and Newsreader (woff2) plus their OFL licence texts
docs/
  INSTRUCTIONS.md     Run, test, use, deploy, manual review checklist
  SYSTEM-DESIGN.md    Architecture, flows, scoring, data, threat model, trade-offs
  FILE-STRUCTURE.md   This file
  PROMPTS.md          Prompt log, by session
  images/             Screenshots used in the README
mockups/
  Concepts.html       The three looks offered before building (A was chosen)
SelfAssuredEval.md    The project spec, with definitions, assumptions and changelog
Shortcuts.md          Shared shortcuts (managed by ProjectForge)
CLAUDE.md             Project instructions for Claude Code
package.json          Only the test script; no dependencies
```
