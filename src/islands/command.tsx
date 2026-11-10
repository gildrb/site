import * as stylex from "@stylexjs/stylex";
import { useRef, useState } from "preact/hooks";
import { announce } from "../announce.ts";
import { colors, fade, media, space, typeScale } from "../tokens.stylex.ts";
import { ui } from "../ui.tsx";

/**
 * One shell block (product pages): each line a command after a `$`, and one button that copies
 * them all, so a paste runs them in order.
 */
export function Command({ commands }: { commands: readonly string[] }) {
  const text = commands.join("\n");
  const single = commands.length === 1;
  const [state, setState] = useState<"idle" | "copied" | "failed">("idle");
  const timer = useRef(0);
  async function copy() {
    const copied = await navigator.clipboard.writeText(text).then(
      () => true,
      () => false,
    );
    setState(copied ? "copied" : "failed");
    const what = single ? "Command" : "Commands";
    announce(copied ? `${what} copied to clipboard` : `${what} could not be copied`);
    clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setState("idle"), 1200);
  }
  return (
    <div {...stylex.props(ui.codeSurface, styles.block)}>
      <code {...stylex.props(ui.mono, styles.lines)}>
        {commands.map((command) => {
          // A trailing ` #` comment (`porthmeus vp dev # or the short form: p vp dev`) is prose,
          // not command: it renders in the quiet rung, unspoken and unselected. Copying keeps it
          // whole — the shell takes a comment line as a comment.
          const comment = command.includes(" #") ? command.slice(command.indexOf("#")) : null;
          return (
            <span key={command} {...stylex.props(styles.line)}>
              <span {...stylex.props(styles.prompt)} aria-hidden="true">
                $
              </span>
              <span {...stylex.props(styles.command)}>
                {comment === null ? command : command.slice(0, command.indexOf("#"))}
              </span>
              {comment !== null && (
                <span {...stylex.props(styles.comment)} aria-hidden="true">
                  {comment}
                </span>
              )}
            </span>
          );
        })}
      </code>
      <button
        {...stylex.props(
          ui.reset,
          ui.respond,
          ui.focusRing,
          styles.copy,
          state === "copied" && styles.done,
        )}
        type="button"
        aria-label={
          state === "failed" ? "Copy failed" : single ? `Copy ${text}` : "Copy the commands"
        }
        onClick={() => void copy()}
      >
        {state === "copied" ? (
          <svg {...stylex.props(styles.icon)} viewBox="0 0 16 16" aria-hidden="true">
            <path d="M3 8.5 6.5 12 13 4.5" />
          </svg>
        ) : (
          <svg {...stylex.props(styles.icon)} viewBox="0 0 16 16" aria-hidden="true">
            <rect x="5.75" y="1.75" width="8.5" height="8.5" rx="2" />
            <rect x="1.75" y="5.75" width="8.5" height="8.5" rx="2" />
          </svg>
        )}
      </button>
    </div>
  );
}

const styles = stylex.create({
  /**
   * A shell block as a panel with depth, after superlogical.com's prompt blocks: the hairline is
   * a gradient border — near-transparent at the top, full hairline strength at the bottom, so it
   * fades downward — drawn as two backgrounds (the fill on `padding-box`, the edge on
   * `border-box`) under a transparent 1px border. Under it, three tight layered shadows, one
   * pixel-step each, seat the panel on the page without floating it. The border takes a pixel a
   * side, so the insets give it back to keep the block's size. The copy button stays a
   * transparent icon: the lines fade out (`fade.end`) before it, so no command runs beneath it.
   */
  block: {
    display: "grid",
    gridTemplateColumns: `minmax(0, 1fr) ${space.toggleSize}`,
    alignItems: "start",
    width: "100%",
    paddingBlock: `calc(${space.unit} / 2 - 1px)`,
    paddingRight: `calc(${space.unit} / 2 - 1px)`,
    backgroundImage: `linear-gradient(${colors.codeBg}, ${colors.codeBg}), linear-gradient(to bottom, ${colors.edgeTop}, ${colors.edgeBottom})`,
    backgroundClip: "padding-box, border-box",
    backgroundOrigin: "padding-box, border-box",
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: "transparent",
    boxShadow:
      "0 1px 1px oklch(0% 0 0 / 0.04), 0 2px 2px -1px oklch(0% 0 0 / 0.04), 0 4px 6px -3px oklch(0% 0 0 / 0.05)",
  },
  lines: {
    display: "grid",
    paddingBlock: `calc(${space.unit} / 2)`,
    paddingLeft: `calc(2 * ${space.unit})`,
    overflowX: "auto",
    scrollbarWidth: "none",
    maskImage: fade.end,
    color: colors.primary,
    fontSize: typeScale.monoSize,
    lineHeight: typeScale.monoLeading,
  },
  line: {
    display: "grid",
    gridTemplateColumns: "2ch max-content",
    paddingRight: space.tableGap,
  },
  prompt: { color: colors.tertiary, userSelect: "none" },
  command: { whiteSpace: "pre" },
  comment: { color: colors.tertiary, whiteSpace: "pre", userSelect: "none" },
  /**
   * A transparent icon, no box: the panel is quiet, so primary contrast reads as pressable.
   * The lines fade out before it (`fade.end`), so no command runs beneath it.
   */
  copy: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: space.toggleSize,
    height: space.toggleSize,
    color: {
      default: colors.tertiary,
      ":hover": { [media.hover]: colors.primary },
      ":focus-visible": colors.primary,
    },
  },
  done: { color: colors.primary },
  /** The label's 14px plus its own stroke's room, with a unit of air, centred in the target. */
  icon: {
    width: `calc(9 * ${space.unit} / 4)`,
    height: `calc(9 * ${space.unit} / 4)`,
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.25,
    strokeLinecap: "round",
    strokeLinejoin: "round",
  },
});
