/**
 * Answers Heph gave from its own guide (the heph-guide armory), recorded with `heph` from the
 * lean-bend-core branch of github.com/gildrb/heph (private) and qwen3.8-27b on a local server.
 * Quotes were checked by heph-core; the demo replays them unchanged.
 */
export type Status = "verified" | "unquoted" | "failed" | "badid";

export type Inline =
  | { $: "Text"; text: string }
  | { $: "Code"; text: string }
  | { $: "Strong"; text: string }
  | { $: "Cite"; label: string; status: Status };

export type Block =
  | { $: "Paragraph"; inlines: Inline[] }
  | { $: "Bullet"; inlines: Inline[] }
  | { $: "Number"; n: number; inlines: Inline[] };

export type Run = {
  question: string;
  /** Words a typed question must share with this run to replay it. */
  keywords: string[];
  read: { count: number; files: string[]; more: number };
  /** Seconds before the model started answering; null for a model that does not reason. */
  thought: number | null;
  answer: Block[];
  /** One line per cited passage, with its worst verdict. */
  sources: { id: string; file: string; status: Status; verdicts: string }[];
  model: string;
  level: string | null;
  /** Tokens in and out, time and speed, as Heph prints them. */
  figures: string[];
  /** The passages sent to the model, as indexes into `passages`. */
  evidence: { id: string; passage: number; cited: number }[];
};

export const armory = { name: "heph-guide", files: 5, login: "127.0.0.1:18020" };

export const passages: { file: string; text: string }[] = [
  {
    file: "3-armories.md",
    text: '# Your own armories\n\n## How do I make my own armory?\n\nPick one:\n\n- In a terminal, go to a folder of your files and run `heph init`, then `heph`.\n- Run `heph init notes` to make an empty armory called notes in `~/.armories`.\n- Inside Heph, type `/armory` and pick "use this folder" or "new armory".\n\nHeph refuses to turn your home folder or `/` into an armory.\n\n## How do I add my own files?\n\nType `/add` and paste or drag a file or folder, or type `/add ~/Documents/report.pdf`.\nHeph copies it into the armory; it never overwrites a file that is already there.\nYou can also copy files into the armory folder with any file manager.\nHeph notices new, changed and deleted files before your next question and re-indexes them.\n\n## How do I switch armories?\n\nType `/armory` and pick one from the list, or type `/armory notes`. Names forgive typos.\nFrom a terminal, `heph notes` opens the armory called notes, and `heph` inside an armory\nfolder opens that folder. Outside any armory, `heph` opens this guide.\n\n## Which files can Heph read?',
  },
  {
    file: "1-start-here.md",
    text: '# Start here\n\n## What is Heph?\n\nHeph answers questions from your own files and shows where each answer came from.\nYou ask in plain words. Heph finds the passages that match, sends them to your model,\nand prints the answer with citations such as [E1] that point back to the file and page.\n\nThis armory is the Heph guide. It holds these pages about Heph itself, so you can learn\nHeph by asking Heph. Try: "how do I add my own files?" or "which models can I use?"\n\n## What is an armory?\n\nAn armory is a folder of files that Heph answers from. Every file in the folder is\nmaterial: notes, PDFs, Word documents, slides, spreadsheets, code. Heph never changes\nyour files. It keeps its index and chats in a hidden `.harness` folder inside the armory.\n\nYou are in one armory at a time. Its name is shown under the prompt, next to the model.\n\n## The first three things to do\n\n1. Ask a question here, to see how answers and citations look.\n2. Make your own armory: run `heph init` in a folder of your files, or type `/armory`.\n3. Pick your model with `/model` if the default local server is not the one you use.',
  },
  {
    file: "4-models.md",
    text: 'example off,\nlow, medium and xhigh for Qwen 3.8, or low up to max for OpenAI\'s GPT-6 models. A model\nwith no levels to choose says so when you press Shift+Tab.\n\n## How do I use my own local server?\n\nType `/model` and pick "add a local server", then type its URL, for example\nhttp://127.0.0.1:1234/v1. You can also type `/model http://127.0.0.1:1234/v1`.\nIf the server wants an API key, Heph asks for it once and saves it.\n\n## How do I log in to OpenAI, OpenRouter, DeepSeek or Z.AI?\n\nType `/login` and pick the provider, then paste your API key. Press Enter without a key\nto use the key in the provider\'s environment variable instead, like OPENAI_API_KEY.\nThen pick a model with `/model`. `/logout` removes a login and its saved key.\n\n## How do I use my ChatGPT subscription?\n\nType `/login` and pick "ChatGPT subscription (Codex)". Heph prints a sign-in URL; open it\nin any browser. When the browser shows success, press Enter. If the browser runs on\nanother machine, paste the address it lands on (http://localhost:1455/auth/callback?code=...).\n\n## Where are logins and keys kept?',
  },
  {
    file: "3-armories.md",
    text: "typos.\nFrom a terminal, `heph notes` opens the armory called notes, and `heph` inside an armory\nfolder opens that folder. Outside any armory, `heph` opens this guide.\n\n## Which files can Heph read?\n\nText of any kind (Markdown, plain text, code, CSV, HTML), PDF, DOCX, PPTX, XLSX, ODT\nand ODS. Old .doc, .ppt, .xls, .odp and .rtf files are skipped: save them as PDF or\nDOCX first. Files over 50 MB, text over 5 MB, scanned PDFs without text and binary\nfiles are skipped, and the reason is shown when indexing.\n\n## How do I keep files out of the index?\n\nAdd a `.harnessignore` file to the armory root with one pattern per line, like\n`.gitignore`: `drafts/`, `*.log`, `old/*.pdf`. `.git`, `node_modules` and\n`__pycache__` are always ignored.",
  },
  {
    file: "5-commands.md",
    text: 'answer.\n- Shift+Tab changes how much the model reasons: its reasoning level, shown after the model.\n- Alt+Enter starts a new line. Up and Down bring back earlier questions.\n\n## Is my data private?\n\nYour files stay on your machine. Heph sends only the question, the recent chat and the\nmatching passages, and only to the model you picked. With a local server nothing leaves\nthe computer. Heph downloads nothing, runs no plugins, gives the model no tools, and\nnever opens a browser. The only program it starts is its own search core.\n\n## Can I use Heph from scripts?\n\nYes:\n\n- `heph ask notes "what is the deadline?"` answers one question from the armory notes.\n- `heph ask notes "..." --json` prints the answer, citations and checks as JSON.\n- `heph index notes` indexes without asking.\n- `heph config` shows the settings and logins in effect.\n\n## Heph cannot reach the model. What now?\n\nCheck that the server named under the prompt is running, then type `/model` to see\nwhich logins answer and why the others fail. A local server usually needs to be started\nwith its API enabled; a hosted login usually needs a valid key.',
  },
  {
    file: "5-commands.md",
    text: "# Commands, privacy and scripts\n\n## Which commands are there?\n\nType `/` to see them all. Commands forgive typos: `/mdl`, `/modle` and `/mod` all find\n`/model`.\n\n- `/model` pick the model, add a local server, or log in\n- `/armory` open or create an armory\n- `/add` copy a file or folder into this armory\n- `/new` start a new chat\n- `/sources` show the passages behind the last answer\n- `/login` and `/logout` add or remove a hosted provider\n- `/help` list the commands and keys; `/exit` or Ctrl+D quit\n\nIn the `/` menu, Up and Down move, Tab completes, Enter runs and Esc closes it.\n\n## Which keys are there?\n\n- Esc stops an answer while it is being written.\n- Ctrl+C clears the line; on an empty line, press it twice to quit. Ctrl+D quits too.\n- Ctrl+L opens the model picker.\n- Ctrl+O shows the passages behind the last answer, in full.\n- Ctrl+T shows or hides the model's thinking after each answer.\n- Shift+Tab changes how much the model reasons: its reasoning level, shown after the model.\n- Alt+Enter starts a new line. Up and Down bring back earlier questions.\n\n## Is my data private?",
  },
  {
    file: "4-models.md",
    text: "# Models and logins\n\n## Which model does Heph use?\n\nThe model in use is shown under the prompt, and the login it runs on at the right. By\ndefault Heph talks to a local OpenAI-compatible server at http://127.0.0.1:8080/v1, such\nas llama.cpp, LM Studio, Ollama or vLLM, and uses the first model that server lists.\n\n## How do I change the model?\n\nType `/model` or press Ctrl+L. It lists every model of every login; pick one with the\narrow keys and Enter, or type to filter. `/model qwen` switches straight to the closest\nmatch. Your choice is saved and used next time.\n\n## How do I change how much the model thinks?\n\nPress Shift+Tab. Each press moves to the model's next reasoning level, shown after the\nmodel name under the prompt: off answers fastest, higher levels think longer before\nanswering. Heph keeps your choice for next time and fits it to each model: a model without\nthat level gets the nearest one below. The levels depend on the model, for example off,\nlow, medium and xhigh for Qwen 3.8, or low up to max for OpenAI's GPT-6 models. A model\nwith no levels to choose says so when you press Shift+Tab.\n\n## How do I use my own local server?",
  },
  {
    file: "2-asking.md",
    text: "- ✓ verified: the quote is really in that passage.\n- ✗ not found: the quote is not in the passage, or the passage does not exist.\n- ? no quote: the model cited a passage without quoting it.\n\nAn answer made only of ✓ citations is backed by your files. Treat ✗ and ? as claims to check.\n\n## How do I see the passages behind an answer?\n\nPress Ctrl+O, or type `/sources`. It shows each passage Heph sent to the model for the\nlast answer, in full, with its file and page, and marks the ones the answer cited.\n\n## Why did Heph say it could not find the answer?\n\nHeph only sends the model the passages that best match the words of your question.\nUse the words your files use, name the document or topic, or ask a narrower question.\nIf the file is new, it is indexed on your next question; check it was not skipped.",
  },
  {
    file: "2-asking.md",
    text: '# Asking questions\n\n## How do I ask a question?\n\nType the question and press Enter. There is no command for it. Alt+Enter starts a new\nline. Follow-up questions remember the last few turns of the chat, so "and in 2023?"\nworks. `/new` starts a fresh chat. Esc stops an answer that is still being written, and\nwhat you typed meanwhile stays in the prompt. Ctrl+D or `/exit` quits.\n\n## What are the lines around an answer?\n\n- "Read 5 passages" names the files Heph found for the question and sent to the model.\n- "Thought for 6.2s" is how long the model took before it started answering. Ctrl+T\n  shows or hides everything it thought, for the next answers.\n- Under the answer, one line per cited passage: ✓ when its quotes are really in it.\n- The last line is the model, tokens in and out, the time and the speed.\n\n## What do the citations mean?\n\nEach answer cites evidence as [E1], [E2] and so on. Every citation carries a short quote,\nand Heph checks that quote against the passage it names:\n\n- ✓ verified: the quote is really in that passage.\n- ✗ not found: the quote is not in the passage, or the passage does not exist.\n- ? no quote: the model cited a passage without quoting it.',
  },
  {
    file: "4-models.md",
    text: "the browser shows success, press Enter. If the browser runs on\nanother machine, paste the address it lands on (http://localhost:1455/auth/callback?code=...).\n\n## Where are logins and keys kept?\n\nLogins are listed in `~/.config/heph/logins.toml`. Each key is a private file in\n`~/.config/heph/keys/`, readable only by you. Answer settings (max_tokens, temperature,\nevidence_tokens) are in `~/.config/heph/config.toml`; `heph config` shows them all.\nFor scripts, HEPH_BASE_URL, HEPH_API_KEY and HEPH_MODEL override the saved login.",
  },
];

export const runs: Run[] = [
  {
    question: "how do I add my own files?",
    keywords: ["add", "files"],
    read: {
      count: 9,
      files: ["3-armories.md", "1-start-here.md", "4-models.md", "5-commands.md"],
      more: 1,
    },
    thought: 3.1,
    answer: [
      {
        $: "Bullet",
        inlines: [
          { $: "Text", text: "Type " },
          { $: "Code", text: "/add" },
          { $: "Text", text: " and paste or drag a file or folder, or type " },
          { $: "Code", text: "/add ~/Documents/report.pdf" },
          { $: "Text", text: " " },
          { $: "Cite", label: "[E1]", status: "verified" },
          { $: "Text", text: "." },
        ],
      },
      {
        $: "Bullet",
        inlines: [
          {
            $: "Text",
            text: "Heph copies it into the armory and does not overwrite an existing file ",
          },
          { $: "Cite", label: "[E1]", status: "verified" },
          { $: "Text", text: "." },
        ],
      },
      {
        $: "Bullet",
        inlines: [
          {
            $: "Text",
            text: "You can also copy files into the armory folder with any file manager ",
          },
          { $: "Cite", label: "[E1]", status: "verified" },
          { $: "Text", text: "." },
        ],
      },
      {
        $: "Bullet",
        inlines: [
          {
            $: "Text",
            text: "Heph notices new, changed, and deleted files before your next question and re-indexes them ",
          },
          { $: "Cite", label: "[E1]", status: "verified" },
          { $: "Text", text: "." },
        ],
      },
    ],
    sources: [
      { id: "E1", file: "3-armories.md", status: "verified", verdicts: "4 quotes verified" },
    ],
    model: "qwen3.8-27b",
    level: "xhigh",
    figures: ["in 2.8K", "out 700", "3.7s", "190 tok/s"],
    evidence: [
      { id: "E1", passage: 0, cited: 4 },
      { id: "E2", passage: 1, cited: 0 },
      { id: "E3", passage: 2, cited: 0 },
      { id: "E4", passage: 3, cited: 0 },
      { id: "E5", passage: 4, cited: 0 },
      { id: "E6", passage: 5, cited: 0 },
      { id: "E7", passage: 6, cited: 0 },
      { id: "E8", passage: 7, cited: 0 },
      { id: "E9", passage: 8, cited: 0 },
    ],
  },
  {
    question: "what do the citations mean?",
    keywords: ["citations", "mean"],
    read: { count: 4, files: ["2-asking.md", "1-start-here.md", "5-commands.md"], more: 0 },
    thought: 13.8,
    answer: [
      {
        $: "Paragraph",
        inlines: [
          { $: "Text", text: "Citations are evidence labels such as " },
          { $: "Cite", label: "[E1]", status: "unquoted" },
          { $: "Text", text: " and " },
          { $: "Cite", label: "[E2]", status: "unquoted" },
          { $: "Text", text: ' [E1: "cites evidence as ' },
          { $: "Cite", label: "[E1]", status: "unquoted" },
          { $: "Text", text: ", " },
          { $: "Cite", label: "[E2]", status: "unquoted" },
          {
            $: "Text",
            text: ' and so on."]. Every citation carries a short quote, and Heph checks that quote against the passage it names ',
          },
          { $: "Cite", label: "[E1]", status: "verified" },
          { $: "Text", text: " " },
          { $: "Cite", label: "[E1]", status: "verified" },
          { $: "Text", text: ":" },
        ],
      },
      {
        $: "Bullet",
        inlines: [
          { $: "Text", text: "✓ verified " },
          { $: "Cite", label: "[E1]", status: "verified" },
        ],
      },
      {
        $: "Bullet",
        inlines: [
          { $: "Text", text: "✗ not found " },
          { $: "Cite", label: "[E1]", status: "verified" },
        ],
      },
      {
        $: "Bullet",
        inlines: [
          { $: "Text", text: "? no quote " },
          { $: "Cite", label: "[E1]", status: "verified" },
        ],
      },
      {
        $: "Paragraph",
        inlines: [
          {
            $: "Text",
            text: "An answer made only of ✓ citations is backed by your files; treat ✗ and ? as claims to check ",
          },
          { $: "Cite", label: "[E3]", status: "verified" },
          { $: "Text", text: " " },
          { $: "Cite", label: "[E3]", status: "verified" },
          { $: "Text", text: "." },
        ],
      },
    ],
    sources: [
      {
        id: "E1",
        file: "2-asking.md",
        status: "unquoted",
        verdicts: "5 quotes verified   2 citations without a quote",
      },
      {
        id: "E2",
        file: "1-start-here.md",
        status: "unquoted",
        verdicts: "2 citations without a quote",
      },
      { id: "E3", file: "2-asking.md", status: "verified", verdicts: "2 quotes verified" },
    ],
    model: "qwen3.8-27b",
    level: "xhigh",
    figures: ["in 1.3K", "out 2.7K", "14.5s", "189 tok/s"],
    evidence: [
      { id: "E1", passage: 8, cited: 7 },
      { id: "E2", passage: 1, cited: 2 },
      { id: "E3", passage: 7, cited: 2 },
      { id: "E4", passage: 4, cited: 0 },
    ],
  },
  {
    question: "how do I change the model?",
    keywords: ["change", "model"],
    read: {
      count: 7,
      files: ["4-models.md", "5-commands.md", "2-asking.md", "1-start-here.md"],
      more: 0,
    },
    thought: 30.4,
    answer: [
      {
        $: "Bullet",
        inlines: [
          { $: "Text", text: "Type " },
          { $: "Code", text: "/model" },
          { $: "Text", text: " or press Ctrl+L " },
          { $: "Cite", label: "[E1]", status: "verified" },
          { $: "Text", text: "." },
        ],
      },
      {
        $: "Bullet",
        inlines: [
          { $: "Text", text: "It lists every model of every login " },
          { $: "Cite", label: "[E1]", status: "verified" },
          { $: "Text", text: ", and pick one with the arrow keys and Enter, or type to filter " },
          { $: "Cite", label: "[E1]", status: "verified" },
          { $: "Text", text: " " },
          { $: "Cite", label: "[E1]", status: "verified" },
          { $: "Text", text: "." },
        ],
      },
      {
        $: "Bullet",
        inlines: [
          { $: "Text", text: "Your choice is saved and used next time " },
          { $: "Cite", label: "[E1]", status: "verified" },
          { $: "Text", text: "." },
        ],
      },
    ],
    sources: [{ id: "E1", file: "4-models.md", status: "verified", verdicts: "5 quotes verified" }],
    model: "qwen3.8-27b",
    level: "xhigh",
    figures: ["in 2.3K", "out 4.7K", "30.8s", "153 tok/s"],
    evidence: [
      { id: "E1", passage: 6, cited: 5 },
      { id: "E2", passage: 5, cited: 0 },
      { id: "E3", passage: 4, cited: 0 },
      { id: "E4", passage: 2, cited: 0 },
      { id: "E5", passage: 8, cited: 0 },
      { id: "E6", passage: 7, cited: 0 },
      { id: "E7", passage: 1, cited: 0 },
    ],
  },
  {
    question: "which files can Heph read?",
    keywords: ["files", "read"],
    read: {
      count: 9,
      files: ["3-armories.md", "2-asking.md", "1-start-here.md", "5-commands.md"],
      more: 1,
    },
    thought: 4.0,
    answer: [
      { $: "Paragraph", inlines: [{ $: "Text", text: "Heph can read:" }] },
      {
        $: "Bullet",
        inlines: [
          {
            $: "Text",
            text: "“Text of any kind (Markdown, plain text, code, CSV, HTML), PDF, DOCX, PPTX, XLSX, ODT and ODS.” ",
          },
          { $: "Cite", label: "[E1]", status: "verified" },
        ],
      },
      { $: "Paragraph", inlines: [{ $: "Text", text: "It skips:" }] },
      {
        $: "Bullet",
        inlines: [
          {
            $: "Text",
            text: "“Old .doc, .ppt, .xls, .odp and .rtf files are skipped: save them as PDF or DOCX first.” ",
          },
          { $: "Cite", label: "[E1]", status: "verified" },
        ],
      },
      {
        $: "Bullet",
        inlines: [
          {
            $: "Text",
            text: "“Files over 50 MB, text over 5 MB, scanned PDFs without text and binary files are skipped, and the reason is shown when indexing.” ",
          },
          { $: "Cite", label: "[E1]", status: "verified" },
        ],
      },
    ],
    sources: [
      { id: "E1", file: "3-armories.md", status: "verified", verdicts: "3 quotes verified" },
    ],
    model: "qwen3.8-27b",
    level: "xhigh",
    figures: ["in 2.7K", "out 599", "4.9s", "123 tok/s"],
    evidence: [
      { id: "E1", passage: 3, cited: 3 },
      { id: "E2", passage: 0, cited: 0 },
      { id: "E3", passage: 8, cited: 0 },
      { id: "E4", passage: 1, cited: 0 },
      { id: "E5", passage: 7, cited: 0 },
      { id: "E6", passage: 4, cited: 0 },
      { id: "E7", passage: 9, cited: 0 },
      { id: "E8", passage: 6, cited: 0 },
      { id: "E9", passage: 2, cited: 0 },
    ],
  },
  {
    question: "how do I keep files out of the index?",
    keywords: ["files", "index", "keep"],
    read: {
      count: 6,
      files: ["3-armories.md", "1-start-here.md", "2-asking.md", "5-commands.md"],
      more: 0,
    },
    thought: 21.8,
    answer: [
      {
        $: "Paragraph",
        inlines: [
          { $: "Text", text: "Add a " },
          { $: "Code", text: ".harnessignore" },
          { $: "Text", text: " file to the armory root with one pattern per line, like " },
          { $: "Code", text: ".gitignore" },
          { $: "Text", text: ": " },
          { $: "Code", text: "drafts/" },
          { $: "Text", text: ", " },
          { $: "Code", text: "*.log" },
          { $: "Text", text: ", " },
          { $: "Code", text: "old/*.pdf" },
          { $: "Text", text: ". " },
          { $: "Cite", label: "[E1]", status: "verified" },
          { $: "Text", text: " " },
          { $: "Cite", label: "[E1]", status: "verified" },
        ],
      },
    ],
    sources: [
      { id: "E1", file: "3-armories.md", status: "verified", verdicts: "2 quotes verified" },
    ],
    model: "qwen3.8-27b",
    level: "xhigh",
    figures: ["in 1.9K", "out 3.1K", "22.2s", "138 tok/s"],
    evidence: [
      { id: "E1", passage: 3, cited: 2 },
      { id: "E2", passage: 1, cited: 0 },
      { id: "E3", passage: 8, cited: 0 },
      { id: "E4", passage: 4, cited: 0 },
      { id: "E5", passage: 0, cited: 0 },
      { id: "E6", passage: 7, cited: 0 },
    ],
  },
];
