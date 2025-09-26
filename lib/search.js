// lib/search.js

export async function webSearch(q) {
  try {
    const url = "https://raw.githubusercontent.com/hyprlyf/externalPattern/refs/heads/main/convopattern.json";
    const res = await fetch(url);
    if (!res.ok) return [];

    const data = await res.json();
    const dataset = data.patterns || [];

    const lowerQ = q.toLowerCase();

    const results = dataset.filter(item => {
      // conversation type
      if (item.type === "conversation") {
        return item.conversation.some(c => c.message.toLowerCase().includes(lowerQ));
      }
      // explanation type
      if (item.type === "explanation") {
        return (
          item.topic?.toLowerCase().includes(lowerQ) ||
          item.pattern?.template?.toLowerCase().includes(lowerQ)
        );
      }
      return false;
    });

    // Format clean response
    return results.map(r => {
      if (r.type === "conversation") {
        const matchedMsg = r.conversation.find(c =>
          c.message.toLowerCase().includes(lowerQ)
        );
        return {
          url,
          title: "Conversation",
          snippet: matchedMsg ? `${matchedMsg.role}: ${matchedMsg.message}` : "Conversation match"
        };
      }

      if (r.type === "explanation") {
        return {
          url,
          title: r.topic || "Explanation",
          snippet: r.pattern?.template?.slice(0, 220) || "Explanation found"
        };
      }

      return { url, title: r.type, snippet: "Match found" };
    }).slice(0, 8);

  } catch (err) {
    console.error("Dataset fetch error:", err);
    return [];
  }
}
