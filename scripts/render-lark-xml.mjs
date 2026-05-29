import fs from "node:fs";
import { fileURLToPath } from "node:url";

function readJson() {
  const arg = process.argv[2];
  const raw = arg ? fs.readFileSync(arg, "utf8") : fs.readFileSync(0, "utf8");
  return JSON.parse(raw);
}

function escapeXml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function renderInlineMarkdown(value) {
  const escaped = escapeXml(value);
  return escaped.replace(/\[([^\]]+)]\((https?:\/\/[^)]+)\)/g, (_, text, url) => {
    return `<a href="${escapeXml(url)}">${escapeXml(text)}</a>`;
  });
}

function renderParagraphPair(paragraph) {
  const en = typeof paragraph === "string" ? paragraph : paragraph.en;
  const zh = typeof paragraph === "string" ? "" : paragraph.zh;
  const zhText = zh || en;
  return [
    `<p>${renderInlineMarkdown(en)}</p>`,
    `<blockquote>${renderInlineMarkdown(zhText)}</blockquote>`,
  ].join("\n");
}

function renderItem(item) {
  const titleZh = item.title_zh ? ` <span text-color="gray">/ ${escapeXml(item.title_zh)}</span>` : " <span text-color=\"gray\">/ （待翻译标题）</span>";
  const meta = item.meta ? ` <span text-color="gray">(${escapeXml(item.meta)})</span>` : "";
  const sponsor = item.sponsor ? ` <span background-color="light-yellow">Sponsor</span>` : "";
  const paragraphs = item.paragraphs_zh
    ? item.paragraphs.map((en, idx) => ({ en, zh: item.paragraphs_zh[idx] ?? "" }))
    : item.paragraphs ?? [];
  return [
    item.url
      ? `<h3><a href="${escapeXml(item.url)}">${escapeXml(item.title)}</a>${titleZh}${meta}${sponsor}</h3>`
      : `<h3>${escapeXml(item.title)}${titleZh}${meta}${sponsor}</h3>`,
    ...paragraphs.map(renderParagraphPair),
  ].join("\n");
}

export function renderDigest(data) {
  const date = data.source?.newsletter_date ?? new Date().toISOString().slice(0, 10);
  const subject = data.source?.original_subject || data.source?.subject || "TLDR AI";
  const subjectZh = data.source?.original_subject_zh || data.source?.subject_zh || "（待翻译标题）";
  const summary = data.summary_zh ?? [];
  const lines = [
    `<title>TLDR AI 中英对照 - ${escapeXml(date)}</title>`,
    `<h1>TLDR AI 中英对照 - ${escapeXml(date)}</h1>`,
  ];
  if (summary.length) {
    lines.push("<h2>今日速读</h2>");
    lines.push("<ol>");
    for (const point of summary) {
      lines.push(`<li seq="auto">${renderInlineMarkdown(point)}</li>`);
    }
    lines.push("</ol>");
  }
  for (const section of data.sections ?? []) {
    lines.push(`<h2>${escapeXml(section.name)}</h2>`);
    for (const item of section.items ?? []) {
      lines.push(renderItem(item));
      lines.push("<hr/>");
    }
  }
  if (data.view_online_url) {
    lines.push(`<bookmark name="View Online" href="${escapeXml(data.view_online_url)}"></bookmark>`);
  }
  lines.push(`<h2>关于本期</h2>`);
  lines.push(`<callout emoji="📌" background-color="light-blue" border-color="blue">`);
  lines.push(`<p><b>原邮件主题：</b>${escapeXml(subject)}</p>`);
  lines.push(`<p><b>中文标题：</b>${escapeXml(subjectZh)}</p>`);
  lines.push(`<p><b>阅读方式：</b>先看中文速读，再按栏目阅读英文原文与中文翻译。</p>`);
  lines.push(`</callout>`);
  return `${lines.join("\n")}\n`;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  process.stdout.write(renderDigest(readJson()));
}
