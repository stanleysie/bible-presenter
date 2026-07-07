export function formatDisplayReference(
  reference: string,
  translationAbbreviation: string
): string {
  if (!reference) return ''
  if (!translationAbbreviation) return reference
  return `${reference} (${translationAbbreviation})`
}
