import { diff_match_patch } from 'diff-match-patch';

export type DiffOperation = number; // DELETE (-1) | EQUAL (0) | INSERT (1)
export type Diff = [DiffOperation, string];

export function computeDiff(original: string, corrected: string): Diff[] {
  const dmp = new diff_match_patch();
  const diffs = dmp.diff_main(original, corrected);
  dmp.diff_cleanupSemantic(diffs);
  return diffs;
}
