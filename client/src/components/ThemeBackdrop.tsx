import { useId } from "react";
import type { MotifId } from "../lib/themes";

/**
 * The tile for each theme, drawn as stroked paths on a 120×120 grid.
 *
 * Everything is `stroke="currentColor"` with no fills, so a motif inherits the
 * theme accent and stays a light pen drawing rather than a block of colour — at
 * the opacity this renders, filled shapes would read as smudges. Motifs are
 * offset within the tile (not centred) so the repeat doesn't resolve into
 * obvious rows and columns.
 */
const MOTIFS: Record<MotifId, React.ReactNode> = {
  // Coins and a cowrie — general savings.
  coins: (
    <>
      <circle cx="26" cy="28" r="11" />
      <circle cx="26" cy="28" r="5" />
      <circle cx="84" cy="74" r="9" />
      <path d="M84 68v12M79 71h10" />
      <path d="M20 84c4-7 12-7 16 0" />
      <path d="M92 26c-5 3-5 9 0 12" />
    </>
  ),
  // Carrot, tomato and a leaf — market produce.
  produce: (
    <>
      <path d="M24 20c6 4 8 12 5 20-7-2-11-9-9-16" />
      <path d="M24 20l4-8" />
      <circle cx="82" cy="34" r="10" />
      <path d="M82 24c3-4 7-5 9-3" />
      <path d="M18 78c10-10 22-8 26 2-10 6-20 4-26-2z" />
      <path d="M78 80c5-6 12-6 16 0-5 5-11 5-16 0z" />
      <path d="M86 74v-6" />
    </>
  ),
  // Wheel, spokes and a helmet — boda riders.
  wheels: (
    <>
      <circle cx="30" cy="32" r="14" />
      <circle cx="30" cy="32" r="4" />
      <path d="M30 18v8M30 38v8M16 32h8M36 32h8" />
      <path d="M74 82a12 12 0 0124 0" />
      <path d="M74 82h24" />
      <circle cx="88" cy="26" r="8" />
      <path d="M88 18v16" />
    </>
  ),
  // Open book, pencil and a graduation cap — school fees.
  books: (
    <>
      <path d="M16 28h18v20H16zM34 28h18v20H34z" />
      <path d="M34 28v20" />
      <path d="M80 20l8 4-16 26-9 3 1-9z" />
      <path d="M72 76l16-7 16 7-16 7z" />
      <path d="M96 74v10" />
    </>
  ),
  // Maize, a sprout and the sun — farming.
  crops: (
    <>
      <path d="M28 18c7 6 7 20 0 28-7-8-7-22 0-28z" />
      <path d="M28 22v22" />
      <path d="M20 84v-12" />
      <path d="M20 76c-6-2-8-8-6-12 5 0 9 4 9 9" />
      <path d="M20 78c6-3 8-9 6-13-5 1-8 5-8 10" />
      <circle cx="86" cy="72" r="8" />
      <path d="M86 58v6M86 80v6M72 72h6M94 72h6M76 62l4 4M96 62l-4 4" />
    </>
  ),
  // Shop awning, a crate and a hanging scale — trading.
  shop: (
    <>
      <path d="M14 30h34l-5-12H19z" />
      <path d="M14 30v20h34V30" />
      <path d="M25 30l3-12M37 30l-3-12" />
      <path d="M74 74h26v18H74z" />
      <path d="M74 82h26" />
      <path d="M87 74v18" />
      <path d="M86 20v14M76 26h20" />
      <path d="M76 26l-4 8h8zM96 26l-4 8h8z" />
    </>
  ),
};

/**
 * Tiled motif behind the page content.
 *
 * `fixed` + `pointer-events-none` so it never scrolls against the content or
 * intercepts clicks, and `aria-hidden` since it carries no information — it is
 * decoration that says which chama you are looking at. Kept at a very low opacity:
 * this sits under real financial figures, and legibility wins over decoration
 * every time.
 */
export function ThemeBackdrop({ motif }: { motif: MotifId }) {
  // useId keeps the <pattern> id unique if two backdrops ever mount together,
  // otherwise the first definition would win for both.
  const id = useId().replace(/:/g, "");

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 text-chama-700 opacity-[0.07]"
    >
      <svg className="size-full" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern
            id={`motif-${id}`}
            width="120"
            height="120"
            patternUnits="userSpaceOnUse"
            // Rotating the tile hides the underlying grid; without it the eye
            // immediately picks out repeating rows.
            patternTransform="rotate(-8)"
          >
            <g
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              {MOTIFS[motif]}
            </g>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill={`url(#motif-${id})`} />
      </svg>
    </div>
  );
}
