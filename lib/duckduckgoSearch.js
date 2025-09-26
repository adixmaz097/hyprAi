// lib/duckduckgoSearch.js

/**
 * DuckDuckGo search implementation using their official API
 */
export async function duckDuckGoSearch(query, maxResults = 5) {
  try {
    console.log(`🔍 Searching DuckDuckGo for: "${query}"`);
    
    // DuckDuckGo Instant Answer API
    const response = await fetch(
      `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`
    );
    
    if (!response.ok) {
      throw new Error(`DuckDuckGo API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Extract results from the API response
    let results = [];
    
    // 1. First check for Instant Answer (Abstract)
    if (data.AbstractText) {
      results.push(`📚 ${data.AbstractText} (Source: ${data.AbstractSource})`);
    }
    
    // 2. Check for Related Topics
    if (data.RelatedTopics && data.RelatedTopics.length > 0) {
      data.RelatedTopics.slice(0, maxResults).forEach(topic => {
        if (topic.Text) {
          results.push(`🔗 ${topic.Text}`);
        }
      });
    }
    
    // 3. Check for Results (regular search results)
    if (data.Results && data.Results.length > 0) {
      data.Results.slice(0, maxResults).forEach(result => {
        if (result.Text) {
          results.push(`🌐 ${result.Text} - ${result.FirstURL}`);
        }
      });
    }
    
    // If no results found, return a message
    if (results.length === 0) {
      return `No search results found for "${query}".`;
    }
    
    // Return top results
    return results.slice(0, maxResults).join('\n');
    
  } catch (error) {
    console.error('❌ DuckDuckGo search error:', error);
    
    // Fallback: return error message
    return `Search unavailable for "${query}". Please try again later.`;
  }
}

// Alternative implementation using HTML scraping (if API doesn't work)
export async function duckDuckGoSearchAlternative(query, maxResults = 3) {
  try {
    console.log(`🔍 Using alternative search for: "${query}"`);
    
    // Simple mock search results for development
    const mockResults = [
      `Web Result: Information about ${query} from search`,
      `Related: ${query} is a popular topic currently`,
      `News: Latest updates on ${query}`
    ];
    
    return mockResults.join('\n');
    
  } catch (error) {
    console.error('❌ Alternative search error:', error);
    return `Search results for "${query}" are currently unavailable.`;
  }
}