import fs from "node:fs";
import { fileURLToPath } from "node:url";

const KNOWN_SECTIONS = new Set([
  "Headlines & Launches",
  "Deep Dives & Analysis",
  "Engineering & Research",
  "Miscellaneous",
  "Quick Links",
]);

const FOOTER_MARKERS = [
  "Love TLDR?",
  "Want to advertise in TLDR?",
  "Want to work at TLDR?",
  "If you have any comments or feedback",
  "Thanks for reading,",
  "Manage your subscriptions",
];

function readInput() {
  const arg = process.argv[2];
  const raw = arg ? fs.readFileSync(arg, "utf8") : fs.readFileSync(0, "utf8");
  if (!raw.trim()) throw new Error("No input. Pass a Gmail message JSON file or pipe it on stdin.");
  try {
    const parsed = JSON.parse(raw);
    return {
      id: parsed.id ?? parsed.message_id ?? null,
      subject: parsed.subject ?? "",
      from: parsed.from_ ?? parsed.from ?? "",
      email_ts: parsed.email_ts ?? parsed.date ?? null,
      body: parsed.body ?? raw,
    };
  } catch {
    return { id: null, subject: "", from: "", email_ts: null, body: raw };
  }
}

function normalizeLines(body) {
  return body
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function stripForwardHeader(lines) {
  const dateIndex = lines.findIndex((line) => /^TLDR AI \d{4}-\d{2}-\d{2}$/.test(line));
  if (dateIndex >= 0) return lines.slice(dateIndex);
  const originalIndex = lines.findIndex((line) => line === "原始邮件");
  if (originalIndex >= 0) {
    const tldrIndex = lines.findIndex((line, idx) => idx > originalIndex && line === "TLDR");
    if (tldrIndex >= 0) return lines.slice(tldrIndex);
  }
  return lines;
}

function extractLink(line) {
  const match = line.match(/^\[(.+)]\((https?:\/\/[^)]+)\)$/);
  if (!match) return null;
  const text = match[1].trim();
  const url = match[2].trim();
  const readMatch = text.match(/\(([^()]*?(?:minute read|Website|GitHub Repo|Hugging Face Repo|Sponsor))\)$/i);
  return {
    title: readMatch ? text.slice(0, readMatch.index).trim() : text,
    meta: readMatch ? readMatch[1].trim() : null,
    url,
    sponsor: /\bSponsor\b/i.test(text),
  };
}

function extractPlainTitle(line) {
  const readMatch = line.match(/^(.+?)\s+\(([^()]*?(?:minute read|Website|GitHub Repo|Hugging Face Repo|Sponsor))\)\s*$/i);
  if (!readMatch) return null;
  return {
    title: readMatch[1].trim(),
    meta: readMatch[2].trim(),
    url: null,
    sponsor: /\bSponsor\b/i.test(readMatch[2]),
  };
}

function isFooter(line) {
  return FOOTER_MARKERS.some((marker) => line.startsWith(marker));
}

function isEmojiLine(line) {
  return !/[A-Za-z0-9]/.test(line) && [...line].length <= 4;
}

function createSection(name) {
  return { name, items: [] };
}

export function parseMessage(message) {
  const lines = stripForwardHeader(normalizeLines(message.body));
  const dateLine = lines.find((line) => /^TLDR AI \d{4}-\d{2}-\d{2}$/.test(line));
  const newsletterDate = dateLine?.match(/\d{4}-\d{2}-\d{2}/)?.[0] ?? null;
  const sections = [];
  let currentSection = createSection("Sponsor");
  let currentItem = null;

  function pushSectionIfNeeded() {
    if (currentSection.items.length && !sections.includes(currentSection)) {
      sections.push(currentSection);
    }
  }

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    if (line === "TLDR" || line === "Together With" || /^TLDR AI \d{4}-\d{2}-\d{2}$/.test(line)) {
      continue;
    }
    if (isFooter(line)) break;
    if (isEmojiLine(line) && KNOWN_SECTIONS.has(lines[i + 1])) {
      pushSectionIfNeeded();
      currentSection = createSection(lines[i + 1]);
      currentItem = null;
      i += 1;
      continue;
    }
    if (KNOWN_SECTIONS.has(line)) {
      pushSectionIfNeeded();
      currentSection = createSection(line);
      currentItem = null;
      continue;
    }
    const link = extractLink(line) ?? extractPlainTitle(line);
    if (link) {
      currentItem = {
        title: link.title,
        meta: link.meta,
        url: link.url,
        sponsor: link.sponsor || currentSection.name === "Sponsor",
        paragraphs: [],
      };
      currentSection.items.push(currentItem);
      continue;
    }
    if (currentItem) {
      currentItem.paragraphs.push(line);
    }
  }
  pushSectionIfNeeded();

  const originalSubject = lines.find((line) => line.startsWith("主题："))?.replace(/^主题：/, "").trim();
  return {
    source: {
      id: message.id,
      from: message.from,
      subject: message.subject,
      original_subject: originalSubject ?? message.subject?.replace(/^转发：/, "") ?? "",
      email_ts: message.email_ts,
      newsletter_date: newsletterDate,
    },
    sections,
  };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const parsed = parseMessage(readInput());
  process.stdout.write(`${JSON.stringify(parsed, null, 2)}\n`);
}
