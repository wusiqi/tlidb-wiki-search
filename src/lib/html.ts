// HTML utility functions

export function stripTags(s: string): string {
  return s
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&ndash;/g, "–")
    .replace(/&mdash;/g, "—")
    .replace(/\s+/g, " ")
    .trim();
}

export async function fetchHtml(slug: string): Promise<string | null> {
  try {
    const res = await fetch(`https://tlidb.com/cn/${slug}`, {
      headers: { "User-Agent": "WikiSearchTool/1.0" },
      cache: "no-store" as RequestCache,
    });
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  }
}

export const BASE = "https://tlidb.com/cn";
