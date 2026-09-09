export const DEPTH_RANK = { quick: 1, standard: 2, deep: 3, comprehensive: 4 }

export function depthAllowed(maxDepth, requestedDepth) {
  return (DEPTH_RANK[requestedDepth] || 1) <= (DEPTH_RANK[maxDepth] || 1)
}
