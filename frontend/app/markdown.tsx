import React from "react";

function escapeHtml(value: string) { return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\"/g, "&quot;"); }
function inlineMarkdown(value: string) {
  let html = escapeHtml(value);
  html = html.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, "<a href=\"$2\" target=\"_blank\" rel=\"noreferrer\">$1</a>");
  html = html.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/__([^_]+)__/g, "<strong>$1</strong>");
  html = html.replace(/\*([^*]+)\*/g, "<em>$1</em>");
  html = html.replace(/\x60([^\x60]+)\x60/g, "<code>$1</code>");
  return html;
}
export function markdownToHtml(markdown: string) {
  const lines = markdown.split(/\r?\n/);
  const output: string[] = []; let listOpen = false;
  const closeList = () => { if (listOpen) { output.push("</ul>"); listOpen = false; } };
  for (const raw of lines) {
    const line = raw.trim();
    if (!line) { closeList(); continue; }
    const heading = line.match(/^(#{1,3})\s+(.+)$/);
    if (heading) { closeList(); output.push("<h" + heading[1].length + ">" + inlineMarkdown(heading[2]) + "</h" + heading[1].length + ">"); continue; }
    if (/^[-*]\s+/.test(line)) { if (!listOpen) { output.push("<ul>"); listOpen = true; } output.push("<li>" + inlineMarkdown(line.replace(/^[-*]\s+/, "")) + "</li>"); continue; }
    if (/^>\s?/.test(line)) { closeList(); output.push("<blockquote>" + inlineMarkdown(line.replace(/^>\s?/, "")) + "</blockquote>"); continue; }
    closeList(); output.push("<p>" + inlineMarkdown(line) + "</p>");
  }
  closeList(); return output.join("");
}
export function MarkdownPreview({ value, className = "" }: { value: string; className?: string }) {
  return <div className={"markdown-content " + className} dangerouslySetInnerHTML={{ __html: markdownToHtml(value || "বিস্তারিত বিবরণ এখানে দেখা যাবে...") }} />;
}
