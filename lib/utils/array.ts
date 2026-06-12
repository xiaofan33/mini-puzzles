/**
 * Creates a rows×cols 2D array, filled with a static value or a function receiving (row, col)
 */
export function create2DArray<T>(
  rows: number,
  cols: number,
  fillValue: T | ((rowIndex: number, colIndex: number) => T),
) {
  const fill =
    typeof fillValue === "function"
      ? (fillValue as (r: number, c: number) => T)
      : () => fillValue;

  return Array.from({ length: rows }, (_, r) =>
    Array.from({ length: cols }, (_, c) => fill(r, c)),
  );
}

/**
 * Shuffles an array in-place; optionally picks `sampleSize` unique random elements.
 * **Mutates the input array.**
 */
export function arrayShuffle<T>(items: T[], sampleSize?: number) {
  const sourceLength = items.length;
  const targetLength =
    sampleSize !== undefined
      ? Math.min(Math.max(0, Math.floor(sampleSize)), sourceLength)
      : sourceLength;

  if (targetLength === 0) {
    return [];
  }

  for (let i = 0; i < targetLength; i++) {
    const j = i + Math.floor(Math.random() * (sourceLength - i));
    [items[i], items[j]] = [items[j], items[i]];
  }

  return items.slice(0, targetLength);
}
