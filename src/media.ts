/**
 * Images referenced from Markdown as `![Caption](media:<id>)`. Files live in
 * `public/images/optimized/gil-rodrigues-<id>[-<width>].<ext>`; the responsive
 * variants are discovered from the file names at build time.
 */
export type Media = {
  alt: string;
  width: number;
  height: number;
  /** Monochrome logo artwork: inset, square-cornered, inverted in light mode. */
  mark?: "center" | "start";
  /**
   * A silent looping recording, `public/videos/gil-rodrigues-<id>.mp4`; the image files of the
   * same id are its poster frame. It plays only while on screen (see `video.ts`).
   */
  video?: true;
  /**
   * Shown in the archive (`archive.tsx`): finished or working artwork of Gil's own, not
   * feedback threads, app screenshots or other people's work. Labelled with its case study:
   * the one whose page shows it, else `project`; "Archive" when it
   * belongs to none.
   */
  archive?: true;
  /** Archive work that no case page shows but that belongs to this case study (its slug). */
  project?: string;
  /**
   * Shown only as the homepage preview (`preview.ts`) of this project (its slug), which has no
   * page here to take one from; no page shows it.
   */
  preview?: string;
};

export const media: Readonly<Record<string, Media>> = {
  "ben-davis-brandmark": {
    alt: "White db monogram with a central diagonal joining mirrored letterforms",
    archive: true,
    width: 2000,
    height: 1112,
    mark: "center",
  },
  "ben-davis-site-tour": {
    alt: "Screen recording of davis7.sh: the db mark turning into the wordmark, hovering links, the Sponsors page and switching to light mode",
    archive: true,
    width: 1080,
    height: 1036,
    video: true,
  },
  /** The Heph demo's wallpaper: Velázquez, "Apollo in the Forge of Vulcan", 1630, Museo del Prado (public domain). */
  "heph-forge": {
    alt: "Velázquez's painting Apollo in the Forge of Vulcan: Apollo, haloed, speaks to Vulcan and his smiths at the anvil",
    width: 2952,
    height: 2214,
  },
  "heph-terminal": {
    alt: "Heph's glass terminal window over Velázquez's Apollo in the Forge of Vulcan: a cited answer, its quotes verified",
    archive: true,
    project: "heph",
    width: 1637,
    height: 1214,
  },
  "heph-session": {
    alt: "Screen recording of Heph in the terminal answering questions about a folder of lecture notes, citing the files behind each answer",
    width: 1080,
    height: 614,
    video: true,
  },
  "local-studio-tour": {
    alt: "Screen recording of the Local Studio website: the hero, the app interface, the setup prompt for coding models and the phone screens",
    archive: true,
    width: 1080,
    height: 1014,
    video: true,
  },
  "ben-davis-construction": {
    alt: "Ben Davis db monogram shown with construction points and the finished mark",
    archive: true,
    width: 4096,
    height: 2304,
  },
  "ben-davis-original": {
    alt: "Ben Davis's previous db logo built from a slab-sided d and circular b",
    width: 700,
    height: 443,
    mark: "center",
  },
  "curves-poster": {
    alt: "CURVES specimen poster: the wordmark, the unicase alphabet, numerals, punctuation and a sample line",
    archive: true,
    width: 2800,
    height: 15431,
  },
  "filen-app-icon": {
    alt: "Filen app icon using a dimensional rendering of the identity mark",
    archive: true,
    width: 3940,
    height: 2260,
  },
  "filen-brand-system-board": {
    alt: "Filen brand system board with logo, copy, icon, and typography",
    archive: true,
    width: 1600,
    height: 999,
  },
  "filen-exploration-board": {
    alt: "Filen exploration board containing sketches, rejected symbols, wordmarks, and refined identity directions",
    archive: true,
    width: 1280,
    height: 956,
  },
  "filen-identity-system-overview": {
    alt: "Filen red identity exploration showing the logo, typography, app icon, and campaign executions",
    archive: true,
    width: 1600,
    height: 1444,
  },
  "filen-light-lockup": {
    alt: "Metallic Filen lockup across vertical light panels",
    archive: true,
    width: 1600,
    height: 921,
  },
  "filen-light-study": {
    alt: "Monochrome Filen light study with soft beams emerging from the lower-left corner",
    archive: true,
    width: 1600,
    height: 1600,
  },
  "filen-logo-scale": {
    alt: "Filen mark tested at four decreasing sizes",
    archive: true,
    width: 3940,
    height: 2260,
  },
  "filen-logo-texture": {
    alt: "Filen mark over a streaked monochrome visual texture",
    archive: true,
    width: 3940,
    height: 2260,
  },
  "filen-pangolin-exploration": {
    alt: "Filen identity exploration with pangolin and architectural references",
    width: 1600,
    height: 766,
  },
  "filen-pattern-exploration": {
    alt: "Filen pattern explorations built from repeated protective scales",
    archive: true,
    width: 1600,
    height: 611,
  },
  "filen-storage-message": {
    alt: "Campaign graphic reading Storage that earns nothing from knowing you",
    archive: true,
    width: 3940,
    height: 2260,
  },
  "filen-wordmark": {
    alt: "Final Filen mark and wordmark in white on black",
    archive: true,
    width: 3940,
    height: 2260,
  },
  "filen-zero-knowledge-campaign": {
    alt: "Campaign graphic reading Zero knowledge. Total control.",
    archive: true,
    width: 3940,
    height: 2260,
  },
  "archetypon-finder": {
    alt: "Finder window of one Archetypon export: favicon.ico, a PDF and an SVG, then JPEG, PNG and WebP folders with ten sizes each from 16 to 4096 pixels",
    width: 1476,
    height: 1662,
  },
  "heph-answer": {
    alt: "Heph answering how to add your own files, with one cited passage and four quotes verified",
    width: 1682,
    height: 497,
  },
  "heph-interface": {
    alt: "Heph terminal interface showing a cited answer, evidence panel, and command menu",
    width: 1600,
    height: 1004,
  },
  "heph-lockup": {
    alt: "Heph symbol and wordmark",
    archive: true,
    width: 3023,
    height: 860,
    mark: "start",
  },
  "heph-typeface-early": {
    alt: "Early Heph typeface drawing in Glyphs with the lowercase g selected",
    width: 1600,
    height: 909,
  },
  "heph-typeface-refinement": {
    alt: "Continued Heph typeface drawing in Glyphs with lowercase o curves beside a large y",
    width: 1600,
    height: 909,
  },
  "ml7-panel-1": {
    alt: "mL7's Donate panel, built from the M of the mark in teal",
    width: 320,
    height: 100,
  },
  "ml7-panel-2": {
    alt: "mL7's Commands panel, built from the M of the mark in teal",
    width: 320,
    height: 100,
  },
  "ml7-panel-3": {
    alt: "mL7's PC Specs panel, built from the M of the mark in teal",
    width: 320,
    height: 100,
  },
  "ml7-panel-4": {
    alt: "mL7's Hall of Fame panel, built from the M of the mark in teal",
    width: 320,
    height: 100,
  },
  "ml7-twitch-banner": {
    alt: "mL7's Twitch banner: the mark in light gray with a teal brush stroke on black",
    width: 1200,
    height: 480,
  },
  "ml7-logo-system": {
    alt: "mL7 logo with black lettering and an orange directional stroke on white",
    archive: true,
    width: 3473,
    height: 2263,
  },
  "n0thing-export-folder": {
    alt: "Windows Explorer showing AI and PSD folders beside six n0thing wordmark PNG exports",
    width: 951,
    height: 304,
  },
  "n0thing-pixel-variations": {
    alt: "Black, white, and red n0thing pixel wordmark variations",
    archive: true,
    width: 1600,
    height: 1007,
  },
  "n0thing-typewriter-direction": {
    alt: "Typewriter-inspired n0thing and Jordan Gilbert wordmark",
    archive: true,
    width: 1600,
    height: 982,
  },
  "n0thing-wordmark-animation": {
    alt: "Animated medium-gray n0thing pixel wordmark on black with a blinking underscore",
    archive: true,
    width: 1280,
    height: 720,
  },
  "t3-before-after": {
    alt: "T3 logomark before and after comparison showing the final refined joint and terminals",
    archive: true,
    width: 3446,
    height: 2520,
  },
  "t3-canvas-color": {
    alt: "T3 logomark color passes arranged across the exploration canvas",
    width: 1200,
    height: 834,
  },
  "t3-canvas-overview": {
    alt: "Tall T3 exploration canvas filled with logomark studies and rejected directions",
    width: 540,
    height: 1199,
  },
  "t3-canvas-sketches": {
    alt: "T3 logomark sketch passes arranged across the exploration canvas",
    width: 1200,
    height: 834,
  },
  "t3-code-construction": {
    alt: "T3 Code wordmark with diagonal construction guides across the T3 and C",
    archive: true,
    width: 1600,
    height: 900,
  },
  "t3-code-explorations": {
    alt: "Tall design canvas of T3 marks and T3 Code wordmark explorations",
    width: 1304,
    height: 1880,
  },
  "t3-code-outline": {
    alt: "T3 Code wordmark above a larger outlined version on black",
    archive: true,
    width: 1600,
    height: 900,
  },
  "t3-code-scale": {
    alt: "White T3 Code wordmark shown at five decreasing sizes on black",
    archive: true,
    width: 1600,
    height: 900,
  },
  "t3-color-tests": {
    alt: "T3 pink and monochrome colorway tests for the logomark",
    archive: true,
    width: 1199,
    height: 899,
  },
  "t3-connected-mark": {
    alt: "White connected lowercase t and 3 logomark on a dark canvas",
    archive: true,
    width: 1724,
    height: 1200,
  },
  "t3-feedback-angled-3": {
    alt: "Angled T3 3 and the verdict on its direction",
    width: 1200,
    height: 48,
  },
  "t3-feedback-board": {
    alt: "T3 application board posted for feedback in the T3 Discord",
    width: 1200,
    height: 886,
  },
  "t3-feedback-curves": {
    alt: "T3 curve comparison and feedback on the smoothed version",
    width: 1200,
    height: 1266,
  },
  "t3-feedback-frames": {
    alt: "Nine T3 logo frames and the Discord replies they drew",
    width: 1200,
    height: 1127,
  },
  "t3-feedback-repainted": {
    alt: "Repainted T3 board with feedback on its weight and direction",
    width: 1200,
    height: 815,
  },
  "t3-feedback-spacing": {
    alt: "T3 Discord feedback on the spacing between the logomark glyphs",
    width: 1200,
    height: 851,
  },
  "t3-feedback-thinner": {
    alt: "Thinner T3 mark test and feedback on the direction",
    width: 1200,
    height: 382,
  },
  "t3-ghost-grid": {
    alt: "Ghosted T3 comparison grid showing overlapping logomark proportions",
    archive: true,
    width: 1200,
    height: 744,
  },
  "t3-mark": {
    alt: "T3 logomark exploration shown as a compact black and white symbol",
    archive: true,
    width: 1200,
    height: 1200,
  },
  "t3-render": {
    alt: "T3 logomark rendered in a light application setting",
    archive: true,
    width: 1200,
    height: 675,
  },
  "t3-system-board": {
    alt: "T3 identity system board with logotypes, icons, favicons, and clear-space lockup",
    archive: true,
    width: 2048,
    height: 1853,
  },
  "t3-weight-tests": {
    alt: "T3 logomark weight and angle tests comparing heavier and lighter constructions",
    archive: true,
    width: 1200,
    height: 642,
  },
  "archive-raccoon-mascot": {
    alt: "Gray raccoon mascot head with a white outline on black",
    archive: true,
    width: 4096,
    height: 3072,
  },
  "archive-chrome-pattern": {
    alt: "Grid of chrome-shaded block shapes in black and white",
    archive: true,
    width: 3840,
    height: 2160,
  },
  "archive-filen-chrome": {
    alt: "Chrome Filen mark and wordmark across vertical light panels",
    archive: true,
    project: "filen",
    width: 4096,
    height: 2095,
  },
  "archive-embossed-monogram": {
    alt: "Embossed black monogram with a diamond crossbar on black",
    archive: true,
    width: 2048,
    height: 1176,
  },
  "archive-book-mark": {
    alt: "Black mark of an open book with an angled spine on white",
    archive: true,
    width: 1504,
    height: 1128,
  },
  "archive-logo-system-card": {
    alt: "Logo System business card with a blue L mark above its dark wordmark",
    archive: true,
    width: 4000,
    height: 3000,
  },
  "archive-chrome-chevron": {
    alt: "Chrome chevron mark with blue reflections on black",
    archive: true,
    width: 2800,
    height: 2100,
  },
  "archive-neon-lettering": {
    alt: "Spiked lettering in neon blue inside a red orbit on black",
    archive: true,
    width: 4096,
    height: 2756,
  },
  "archive-stream-graphics": {
    alt: "Board of stream graphics: offline, starting and break screens, emotes and logos",
    archive: true,
    width: 4096,
    height: 2223,
  },
  "archive-hexagon-mark": {
    alt: "Purple and pink hexagonal C mark beside its construction lines",
    archive: true,
    width: 4096,
    height: 2047,
  },
  "archive-peaks-mark": {
    alt: "Red mountain-peak mark in four colorways on black and white",
    archive: true,
    width: 4096,
    height: 2867,
  },
  "archive-chrome-lettering": {
    alt: "Spiked chrome lettering in blue and purple on a starry black",
    archive: true,
    width: 2000,
    height: 2000,
  },
  "archive-curves-gradient": {
    alt: "CURVES wordmark and character set in gradient color over a blue swirl",
    archive: true,
    project: "curves",
    width: 4096,
    height: 2304,
  },
  "archive-corebeam-animation": {
    alt: "Animated Corebeam Industries mark: two blocks open into the wordmark and close again",
    archive: true,
    width: 1280,
    height: 720,
  },
  /** Eukhe has no page here; this is its homepage preview only. */
  "eukhe-session": {
    alt: "Eukhe in a terminal: asked which formats a project's CLI exports, it searches and reads the code, then lists each format with the file that encodes it",
    preview: "eukhe",
    width: 1920,
    height: 1200,
  },
};
