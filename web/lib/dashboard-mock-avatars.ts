/**
 * Deterministic "collaborator" avatar index from a note id (full string hash).
 * Avoids using only the last character, which collides for note-001 vs note-011 etc.
 */
export function collaboratorIndexForId(id: string, bucketCount: number): number {
  let h = 0
  for (let i = 0; i < id.length; i++) {
    h = (Math.imul(31, h) + id.charCodeAt(i)) | 0
  }
  return Math.abs(h) % bucketCount
}
