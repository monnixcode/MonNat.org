const menuToggle = document.getElementById("menuToggle");
const mainNav = document.getElementById("mainNav");
menuToggle.addEventListener("click", () => {
  const isOpen = mainNav.classList.toggle("open");
  menuToggle.setAttribute("aria-expanded", String(isOpen));
});
mainNav.querySelectorAll("a").forEach(link => link.addEventListener("click", () => {
  mainNav.classList.remove("open");
  menuToggle.setAttribute("aria-expanded", "false");
}));
document.getElementById("year").textContent = new Date().getFullYear();

const wikiForm = document.getElementById("wikiForm");
const wikiQuery = document.getElementById("wikiQuery");
const wikiLang = document.getElementById("wikiLang");
const wikiStatus = document.getElementById("wikiStatus");
const wikiResults = document.getElementById("wikiResults");

wikiForm.addEventListener("submit", async event => {
  event.preventDefault();
  const query = wikiQuery.value.trim();
  if (!query) return;
  wikiResults.replaceChildren();
  wikiStatus.textContent = "Searching Wikipedia…";
  try {
    const response = await fetch(`/api/wiki-search?q=${encodeURIComponent(query)}&lang=${encodeURIComponent(wikiLang.value)}`);
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Search failed");
    if (!data.results.length) {
      wikiStatus.textContent = "No articles found. Try another keyword or switch language.";
      return;
    }
    wikiStatus.textContent = `${data.results.length} article(s) found. Select a title to read the original source.`;
    data.results.forEach(item => {
      const article = document.createElement("article");
      article.className = "wiki-result";
      const title = document.createElement("a");
      title.href = item.url;
      title.target = "_blank";
      title.rel = "noopener noreferrer";
      title.textContent = item.title;
      const snippet = document.createElement("p");
      snippet.textContent = item.snippet || "Open the source article to read more.";
      const source = document.createElement("small");
      source.textContent = item.source;
      article.append(title, snippet, source);
      wikiResults.append(article);
    });
  } catch (error) {
    wikiStatus.textContent = `${error.message}. You can also search directly on Wikipedia.`;
  }
});

