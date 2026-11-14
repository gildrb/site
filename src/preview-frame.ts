/**
 * The homepage preview's frame (`preview.ts`): on the 8px grid (`tokens.stylex.ts`), the text
 * column's width (four fields, 496px) at 16:10, near most of the pictures (3:2 to 16:9).
 */
export const previewGrid = { unit: 8, column: 4 * 14 * 8 + 3 * 2 * 8, ratio: 10 / 16 } as const;

/**
 * Where the frame sits in the room below the table (`room`, the room's box in the viewport), in
 * the room's own coordinates, and whether the room fits it. Self-contained: `morph.ts` inlines it.
 */
export function previewFrame(
  room: DOMRect,
  grid: typeof previewGrid,
): { top: number; width: number; height: number; fits: boolean } {
  const top = Math.ceil(room.top / grid.unit) * grid.unit;
  const width = Math.min(grid.column, room.width);
  const height = Math.round((width * grid.ratio) / grid.unit) * grid.unit;
  return {
    top: top - room.top,
    width,
    height,
    fits: height <= Math.floor(room.bottom / grid.unit) * grid.unit - top,
  };
}
