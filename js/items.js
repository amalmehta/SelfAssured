// The 22 survey items, word for word from their published sources.
// Rosenberg wording: UMD Sociology's scan of the scale
//   https://socy.umd.edu/about-us/rosenberg-self-esteem-scale
// IPIP wording and keying: Johnson (2014) IPIP-NEO-120, as listed at
//   https://ipip.ori.org/30FacetNEO-PI-RItems.htm

export const SCALES = {
  rosenberg: {
    name: 'Rosenberg Self-Esteem Scale',
    instruction: 'Below is a list of statements dealing with your general feelings about yourself. Pick how strongly you agree or disagree with each.',
    // Value per answer for a positively keyed item (UMD scoring: SA=3 … SD=0).
    options: [
      { label: 'Strongly agree', value: 3 },
      { label: 'Agree', value: 2 },
      { label: 'Disagree', value: 1 },
      { label: 'Strongly disagree', value: 0 },
    ],
    min: 0,
    max: 3,
    citation: 'Rosenberg, M. (1965). Society and the Adolescent Self-Image. Princeton University Press.',
    source: 'https://socy.umd.edu/about-us/using-rosenberg-self-esteem-scale',
    license: 'Public domain, per the University of Maryland Department of Sociology.',
  },
  ipip: {
    name: 'IPIP-NEO-120 (International Personality Item Pool)',
    instruction: 'Describe yourself as you generally are now, not as you wish to be in the future. Pick how accurately each phrase describes you.',
    options: [
      { label: 'Very accurate', value: 5 },
      { label: 'Moderately accurate', value: 4 },
      { label: 'Neither accurate nor inaccurate', value: 3 },
      { label: 'Moderately inaccurate', value: 2 },
      { label: 'Very inaccurate', value: 1 },
    ],
    min: 1,
    max: 5,
    citation: 'Johnson, J. A. (2014). Measuring thirty facets of the Five Factor Model with a 120-item public domain inventory: Development of the IPIP-NEO-120. Journal of Research in Personality, 51, 78–89.',
    source: 'https://ipip.ori.org/30FacetNEO-PI-RItems.htm',
    license: 'Public domain (ipip.ori.org).',
  },
};

// flip: true means the part score is 100 − the facet score (Steadiness = reversed Vulnerability).
export const PARTS = {
  worth: {
    name: 'Self-worth',
    scale: 'rosenberg',
    icon: 'worth',
    short: 'Feeling you are fine as you are.',
    measures: 'How much you value yourself overall: the 10-item Rosenberg Self-Esteem Scale, a long-standing and widely used self-esteem measure.',
    doesNot: 'It isn’t how good you are at things, and it isn’t how others see you. A high score isn’t arrogance; the scale asks about worth, not superiority.',
    reliability: 'Cronbach’s α .77–.88 across samples (UMD Sociology).',
  },
  efficacy: {
    name: 'Handling things',
    scale: 'ipip',
    icon: 'efficacy',
    short: 'Trusting yourself to get things done.',
    measures: 'Self-efficacy: confidence that you can complete what you set out to do (IPIP-NEO-120 facet C1).',
    doesNot: 'It isn’t a measure of skill. It is how capable you feel, which can run ahead of or behind what you can actually do.',
    reliability: 'α = .77 (4 items; ipip.ori.org, from Johnson 2014).',
  },
  assert: {
    name: 'Speaking up',
    scale: 'ipip',
    icon: 'assert',
    short: 'Taking the lead and saying what you think.',
    measures: 'Assertiveness: taking charge and leading rather than waiting for others (IPIP-NEO-120 facet E3).',
    doesNot: 'Quiet people can be very self-assured. This part is about stepping forward in groups, not about inner confidence.',
    reliability: 'α = .85 (4 items; ipip.ori.org, from Johnson 2014).',
  },
  steady: {
    name: 'Steadiness',
    scale: 'ipip',
    icon: 'steady',
    flip: true,
    short: 'Staying calm when things get hard.',
    measures: 'The reverse of Vulnerability: how well you stay composed under pressure (IPIP-NEO-120 facet N6, flipped so higher = steadier).',
    doesNot: 'It isn’t a mental-health screen. Feeling overwhelmed sometimes is normal; this asks how you generally are.',
    reliability: 'α = .76 for Vulnerability (4 items; ipip.ori.org, from Johnson 2014).',
  },
};

// key: +1 positively keyed, −1 reverse keyed (within its own facet).
// Rosenberg reverse items are 3, 5, 8, 9, 10 per UMD.
export const ITEMS = [
  { id: 'r1', part: 'worth', key: 1, text: 'I feel that I’m a person of worth, at least on an equal plane with others.' },
  { id: 'r2', part: 'worth', key: 1, text: 'I feel that I have a number of good qualities.' },
  { id: 'r3', part: 'worth', key: -1, text: 'All in all, I am inclined to feel that I am a failure.' },
  { id: 'r4', part: 'worth', key: 1, text: 'I am able to do things as well as most other people.' },
  { id: 'r5', part: 'worth', key: -1, text: 'I feel I do not have much to be proud of.' },
  { id: 'r6', part: 'worth', key: 1, text: 'I take a positive attitude toward myself.' },
  { id: 'r7', part: 'worth', key: 1, text: 'On the whole, I am satisfied with myself.' },
  { id: 'r8', part: 'worth', key: -1, text: 'I wish I could have more respect for myself.' },
  { id: 'r9', part: 'worth', key: -1, text: 'I certainly feel useless at times.' },
  { id: 'r10', part: 'worth', key: -1, text: 'At times I think I am no good at all.' },
  // IPIP, interleaved C1 / E3 / N6
  { id: 'c1a', part: 'efficacy', key: 1, text: 'Complete tasks successfully.' },
  { id: 'e3a', part: 'assert', key: 1, text: 'Take charge.' },
  { id: 'n6a', part: 'steady', key: 1, text: 'Panic easily.' },
  { id: 'c1b', part: 'efficacy', key: 1, text: 'Excel in what I do.' },
  { id: 'e3b', part: 'assert', key: 1, text: 'Try to lead others.' },
  { id: 'n6b', part: 'steady', key: 1, text: 'Become overwhelmed by events.' },
  { id: 'c1c', part: 'efficacy', key: 1, text: 'Handle tasks smoothly.' },
  { id: 'e3c', part: 'assert', key: 1, text: 'Take control of things.' },
  { id: 'n6c', part: 'steady', key: 1, text: 'Feel that I’m unable to deal with things.' },
  { id: 'c1d', part: 'efficacy', key: 1, text: 'Know how to get things done.' },
  { id: 'e3d', part: 'assert', key: -1, text: 'Wait for others to lead the way.' },
  { id: 'n6d', part: 'steady', key: -1, text: 'Remain calm under pressure.' },
];
