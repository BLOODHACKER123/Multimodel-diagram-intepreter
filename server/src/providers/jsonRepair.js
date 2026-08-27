function removeTrailingCommas(json) {
  // Remove commas immediately before a closing brace or bracket.
  // This fixes the most common LLM JSON syntax error without needing a full parser.
  return json.replace(/,(\s*[}\]])/g, '$1')
}

export function extractJson(text) {
  const trimmed = text.trim()

  // Strip markdown fences
  const fenceMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/)
  const inner = fenceMatch ? fenceMatch[1].trim() : trimmed

  const firstBrace = inner.indexOf('{')
  const lastBrace = inner.lastIndexOf('}')
  if (firstBrace === -1 || lastBrace === -1 || lastBrace < firstBrace) {
    throw new Error('No JSON object found in response')
  }
  return removeTrailingCommas(inner.slice(firstBrace, lastBrace + 1))
}
