export default async function handler(req, res) {
  const id = String(req.query.id || "").replace(/\D/g, "");
  if (!id) return res.status(400).json({ error: "missing" });
  const response = await fetch("https://midad.com/recitation/" + id, {
    headers: {
      "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
      "accept": "text/html,application/xhtml+xml"
    }
  });
  const html = await response.text();
  const decoded = html.replace(/\\\//g, "/").replace(/&/g, "&");
  const match = decoded.match(/https:\/\/fra1\.digitaloceanspaces\.com\/media\.midad\.com\/[^"'\s]+\.mp3[^"'\s]*/);
  if (!match) return res.status(404).json({ error: "no-audio", status: response.status, length: html.length });
  res.setHeader("Cache-Control", "s-maxage=3600, stale-while-revalidate=86400");
  res.status(200).json({ url: match[0] });
}
