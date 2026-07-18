export function isCompleteChapter(
  verses: Array<{ verse: number; text?: string }>,
  contiguousVerses = true
): boolean {
  if (verses.length === 0) return false

  const sorted = [...verses].sort((a, b) => a.verse - b.verse)
  if (sorted[0].verse !== 1) return false

  const seen = new Set<number>()
  for (let i = 0; i < sorted.length; i++) {
    const item = sorted[i]
    if (!Number.isInteger(item.verse) || item.verse < 1 || seen.has(item.verse)) return false
    if (contiguousVerses && item.verse !== i + 1) return false
    if (item.text !== undefined && item.text.trim().length === 0) {
      return false
    }
    seen.add(item.verse)
  }

  return true
}
