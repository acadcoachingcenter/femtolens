export const DEPTH_RANK = { quick: 1, standard: 2, deep: 3, comprehensive: 4 }

export const TIERS = {
  trial: {
    key: 'trial',
    label: 'Trial',
    priceInr: 0,
    runsPerPeriod: 5,
    maxDepth: 'standard',
    periodDays: 30,
    blurb: 'Explore FEMTOLENS with real PubMed literature and grounded synthesis.',
    features: ['5 research runs / month', 'Quick & Standard depth', 'Full report export'],
  },
  pro: {
    key: 'pro',
    label: 'Pro',
    priceInr: 799,
    runsPerPeriod: 60,
    maxDepth: 'deep',
    periodDays: 30,
    blurb: 'For active researchers and clinicians running regular literature checks.',
    features: ['60 research runs / month', 'Up to Deep depth', 'Full report export', 'Priority evidence extraction'],
  },
  elite: {
    key: 'elite',
    label: 'Elite',
    priceInr: 1999,
    runsPerPeriod: 200,
    maxDepth: 'comprehensive',
    periodDays: 30,
    blurb: 'For labs and teams running comprehensive systematic-review-grade research.',
    features: ['200 research runs / month', 'All depths incl. Comprehensive', 'Full report export', 'Priority evidence extraction'],
  },
}

export function depthAllowed(tierKey, depth) {
  const tier = TIERS[tierKey] || TIERS.trial
  return (DEPTH_RANK[depth] || 1) <= DEPTH_RANK[tier.maxDepth]
}

export function publicTierList() {
  return Object.values(TIERS).map(({ key, label, priceInr, blurb, features }) => ({ key, label, priceInr, blurb, features }))
}
