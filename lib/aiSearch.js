import { webSearch } from "./search";
import { batchScrape } from "./scrape";

export async function aiSearchTool(query) {
  try {
    console.log("search for:", query);
    // Step 1: Web search
    const searchResults = await webSearch(query);
    console.log("search result count:", searchResults?.length || 0);
    if (!searchResults || searchResults.length === 0){
      console.log("no search results found");
      return "No search result found";
    }

    // Step 2: Top 3 URLs scrape
    const urls = searchResults.map(r => r.url).filter(Boolean).slice(0, 3);
      console.log("URLs to scrape:", urls);
    
    if (urls.length === 0) {
      console.log("❌ No valid URLs found");
      return "No valid URLs found for scraping.";
    }

    const scrapedData = await batchScrape(urls, 3);
    console.log("Scraped data count:", scrapedData?.length || 0);
    // Step 3: Combine only scraped content (without URLs or snippets)

    let searchContext = "";
    let hasContent = false;
    
      scrapedData.forEach((data) => {
      if (data.content && data.content.trim() !== "") {
        searchContext += data.content.substring(0, 500) + "\n\n";
        hasContent = true;
      }
    });
    // Extra safety: agar kuch bhi nahi mila to empty string
    if (!hasContent) {
      console.log("❌ No content found in scraped data");
      return "No content found in scraped pages.";
    }

    console.log("✅ Search context generated:", searchContext.length, "characters");
    return searchContext.trim();
    
  } catch (err) {
    console.error("AI Search Tool error:", err);
    return "Search tool encountered an error.";
  }
}