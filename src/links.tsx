import * as stylex from "@stylexjs/stylex";
import type { ComponentChildren } from "preact";
import { contacts, type Link, profiles } from "./site.ts";
import { media, rootMarker, space } from "./tokens.stylex.ts";
import { Signature, type Style, ui, untranslated } from "./ui.tsx";

/**
 * Where the links stand:
 * - `Page`: an inner page's sidebar on desktop; on phones the page's foot, before the signature,
 *   so a long page never ends in a dead end.
 * - `Home`: the homepage's sidebar, desktop only.
 * - `List`: phones, the end of the homepage's scrolling list (`portfolio.tsx`).
 */
export type Place = "Page" | "Home" | "List";

/**
 * Contact, then the profile links, then the signature on desktop. Phones set Links and Contact
 * side by side, Links on the left. `email` is the copy button: an island in the page shell, the
 * component itself inside an island that is already hydrated (`portfolio.tsx`).
 */
export function Links({ place, email }: { place: Place; email: ComponentChildren }) {
  const link = (item: Link, placement: Style, me: boolean) => (
    <a
      {...stylex.props(ui.quiet, ui.respond, ui.focusRing, styles.link, placement)}
      href={item.href}
      rel={me ? "me noopener noreferrer" : "noopener noreferrer"}
      itemProp={place === "List" || !me ? undefined : "sameAs"}
      {...untranslated}
    >
      <span data-nosnippet>{item.label}</span>
    </a>
  );
  return (
    <nav
      {...stylex.props(ui.text, styles.links, placeStyle(place))}
      aria-label="Public profiles and contact"
      data-home-links={place === "Home" || undefined}
    >
      <div {...stylex.props(styles.linkGroup)}>
        <p {...stylex.props(ui.label, styles.label, styles.contactLabel)}>
          <span data-nosnippet>Contact</span>
        </p>
        {email}
        {contacts.map((item) => link(item, null, false))}
      </div>
      <div {...stylex.props(styles.linkGroup, styles.profiles)}>
        <p {...stylex.props(ui.label, styles.label, styles.profileLabel, styles.profileGroup)}>
          <span data-nosnippet>Links</span>
        </p>
        {profiles.map((item) => link(item, styles.profileGroup, true))}
      </div>
      <Signature style={[styles.label, styles.sidebarSignature]} />
    </nav>
  );
}

function placeStyle(place: Place): Style {
  switch (place) {
    case "Page":
      return styles.page;
    case "Home":
      return styles.home;
    case "List":
      return styles.list;
    default: {
      const _: never = place;
      return _;
    }
  }
}

const styles = stylex.create({
  links: {
    display: "flex",
    flexDirection: { default: "column", [media.mobile]: "row" },
    rowGap: space.linkGap,
    gridColumn: { default: null, [media.mobile]: "1 / -1" },
  },
  /** Phones: after the page's content, one empty line below it; the signature follows. */
  page: {
    order: { default: null, [media.mobile]: 6 },
    marginTop: { default: null, [media.mobile]: space.groupGap },
  },
  home: {
    display: { default: "flex", [media.mobile]: "none" },
    // Desktop: beside the lists, so the Projects label stands on Contact's line.
    gridRow: 2,
    alignSelf: { default: null, [media.desktop]: "start" },
  },
  /** Phones: one empty line below Archive, as a later group's label stands below its rows. */
  list: {
    display: { default: "none", [media.mobile]: "flex" },
    paddingTop: `calc(8 * ${space.unit} - ${space.linkLineHeight} - ${space.touchInset})`,
    paddingBottom: space.touchInset,
  },
  /** Desktop: one list, as if ungrouped. Phones: Links and Contact side by side (`profiles`). */
  linkGroup: {
    display: { default: "contents", [media.mobile]: "flex" },
    flexDirection: "column",
    rowGap: space.linkGap,
    flex: { default: null, [media.mobile]: "1 1 0" },
    minWidth: 0,
  },
  /** Phones: Links first, on the left half; Contact takes the right half. */
  profiles: {
    order: { default: null, [media.mobile]: -1 },
    flex: { default: null, [media.mobile]: "0 0 50%" },
  },
  label: { width: "fit-content" },
  profileLabel: { marginTop: { default: null, [media.desktop]: space.sidebarBaselinePitch } },
  /** Desktop: under the profile links, a label's pitch below, as Links stands below Contact. */
  sidebarSignature: {
    display: { default: "none", [media.desktop]: "block" },
    marginTop: space.sidebarBaselinePitch,
    whiteSpace: "nowrap",
  },
  /** Compact (a dense homepage too short for the whole sidebar, see `align.ts`): contact stays. */
  profileGroup: {
    display: {
      default: null,
      [stylex.when.ancestor("[data-compact]", rootMarker)]: { [media.desktop]: "none" },
    },
  },
  link: {
    paddingBlock: `calc(${space.linkGap} / 2)`,
    marginBlock: `calc(${space.linkGap} / -2)`,
  },
  contactLabel: {
    marginTop: {
      default: `calc(${space.sectionGap} - ${space.sectionContentGap})`,
      [media.desktop]: 0,
      [media.mobile]: 0,
    },
  },
});
