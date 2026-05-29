import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const sample = {
  id: "sample",
  from_: "TLDR AI <dan@tldrnewsletter.com>",
  subject: "xAI Cursor limits",
  email_ts: "2026-05-27T21:33:00",
  body: `
TLDR

Together With

TLDR AI 2026-05-27

[Example Sponsor (Sponsor)](https://example.com/sponsor)

Sponsor paragraph.

🚀

Headlines & Launches

[Musk's xAI Warns Staffers to Limit Contact With Cursor Employees (4 minute read)](https://example.com/xai)

xAI's top lawyer has warned xAI employees to carefully moderate their interactions with workers from Cursor.

🧠

Deep Dives & Analysis

[How we contain Claude across products (28 minute read)](https://example.com/claude)

Agents are a new category of software, but their system-level interactions are not.

Love TLDR? Tell your friends and get rewards!
`,
};

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "tldr-"));
const input = path.join(tmp, "message.json");
const parsed = path.join(tmp, "parsed.json");
fs.writeFileSync(input, JSON.stringify(sample), "utf8");

const parse = spawnSync(process.execPath, ["scripts/parse-tldr-email.mjs", input], {
  cwd: process.cwd(),
  encoding: "utf8",
});
if (parse.status !== 0) {
  process.stderr.write(parse.stderr);
  process.exit(parse.status ?? 1);
}
fs.writeFileSync(parsed, parse.stdout, "utf8");

const data = JSON.parse(parse.stdout);
if (data.source.newsletter_date !== "2026-05-27") throw new Error("Failed to parse newsletter date.");
if (data.sections.length !== 3) throw new Error(`Expected 3 sections, got ${data.sections.length}.`);
if (data.sections[2].items.length !== 1) throw new Error("Expected one Deep Dives item.");

data.summary_zh = [
  "xAI 与 Cursor 员工接触受到限制。",
  "Claude containment 文章强调环境层隔离。",
];
data.sections[0].items[0].paragraphs_zh = ["赞助段落。"];
data.sections[2].items[0].paragraphs_zh = ["Agent 是一种新的软件类别，但系统层交互并不新。"];
fs.writeFileSync(parsed, JSON.stringify(data), "utf8");

const render = spawnSync(process.execPath, ["scripts/render-lark-xml.mjs", parsed], {
  cwd: process.cwd(),
  encoding: "utf8",
});
if (render.status !== 0) {
  process.stderr.write(render.stderr);
  process.exit(render.status ?? 1);
}
if (!render.stdout.includes("<title>TLDR AI 中英对照 - 2026-05-27</title>")) {
  throw new Error("Rendered XML title missing.");
}
process.stdout.write("validate ok\n");
