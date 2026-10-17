const http = require("http");
const fs = require("fs");
const path = require("path");
const { URL } = require("url");

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.join(__dirname, "public");
const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".webp": "image/webp"
};

const wikiHosts = {
  en: "https://en.wikipedia.org/w/api.php",
  th: "https://th.wikipedia.org/w/api.php",
  mnw: "https://mnw.wikipedia.org/w/api.php"
};

async function getWikiResults(query, lang = "mnw") {
  const endpoint = wikiHosts[lang] || wikiHosts.mnw;
  const params = new URLSearchParams({
    action: "query",
    list: "search",
    srsearch: query,
    srlimit: "8",
    srprop: "snippet",
    format: "json",
    origin: "*"
  });
  const response = await fetch(`${endpoint}?${params}`, {
    headers: { "User-Agent": "MonNat.org/1.0 (Mon community information portal)" }
  });
  if (!response.ok) throw new Error(`Wikipedia API returned ${response.status}`);
  const data = await response.json();
  return (data.query?.search || []).map(item => ({
    title: item.title,
    snippet: String(item.snippet || "").replace(/<[^>]*>/g, "").replace(/&quot;/g, '"').replace(/&amp;/g, "&").replace(/&#039;/g, "'"),
    url: `https://${lang === "mnw" ? "mnw" : lang}.wikipedia.org/wiki/${encodeURIComponent(item.title.replace(/ /g, "_"))}`,
    source: `${lang.toUpperCase()} Wikipedia`
  }));
}

const server = http.createServer(async (req, res) => {
  const parsed = new URL(req.url, `http://${req.headers.host || "localhost"}`);

  if (parsed.pathname === "/api/wiki-search") {
    const query = (parsed.searchParams.get("q") || "").trim();
    const lang = parsed.searchParams.get("lang") || "mnw";
    if (!query) {
      res.writeHead(400, { "Content-Type": "application/json; charset=utf-8" });
      return res.end(JSON.stringify({ error: "Please enter a search term." }));
    }
    try {
      const results = await getWikiResults(query, lang);
      res.writeHead(200, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "public, max-age=300" });
      return res.end(JSON.stringify({ results, language: lang }));
    } catch (error) {
      res.writeHead(502, { "Content-Type": "application/json; charset=utf-8" });
      return res.end(JSON.stringify({ error: "Could not reach Wikipedia right now. Try again later.", details: error.message }));
    }
  }

  let pathname = decodeURIComponent(parsed.pathname);
  if (pathname === "/") pathname = "/index.html";
  const target = path.normalize(path.join(PUBLIC_DIR, pathname));
  if (!target.startsWith(PUBLIC_DIR)) {
    res.writeHead(403);
    return res.end("Forbidden");
  }
  fs.readFile(target, (err, data) => {
    if (err) {
      res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      return res.end("404 - Page not found");
    }
    res.writeHead(200, { "Content-Type": MIME[path.extname(target)] || "application/octet-stream" });
    res.end(data);
  });
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`MonNat.org is running at http://localhost:${PORT}`);
});
