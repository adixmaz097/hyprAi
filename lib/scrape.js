import { JSDOM } from "jsdom";
import { Readability } from "@mozilla/readability";

// 🟢 Helper function yaha rakho
function unwrapDuckDuckGo(url) {
  try {
    const u = new URL(url);
    if (u.hostname.includes("duckduckgo.com") && u.searchParams.get("uddg")) {
      return decodeURIComponent(u.searchParams.get("uddg"));
    }
  } catch {}
  return url;
}

export async function scrapeReadable(url) {
  const finalUrl = unwrapDuckDuckGo(url); // 🔥 use here

  const res = await fetch(finalUrl, { headers: { "User-Agent": "Mozilla/5.0" } });
  if (!res.ok) throw new Error(`Failed to fetch ${finalUrl}: ${res.status}`);
  const html = await res.text();
  const dom = new JSDOM(html, { url: finalUrl });
  const reader = new Readability(dom.window.document);
  const article = reader.parse();
  return {
    url: finalUrl,
    title: article?.title || dom.window.document.title || finalUrl,
    byline: article?.byline || "",
    content: article?.textContent || "",
  };
}

export async function batchScrape(urls = [], limit = 3) {
  const top = urls.slice(0, limit);
  const out = [];
  for (const u of top) {
    try { 
      out.push(await scrapeReadable(u)); 
    } catch (e) { 
      /* ignore */ 
    }
  }
  return out;
}
