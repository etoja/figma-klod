import express from "express";

const app = express();
app.use(express.json({ limit: "1mb" }));

// CORS for Figma plugin (origin is null)
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "content-type, x-proxy-token");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});

app.get("/health", (_, res) => res.json({ ok: true }));

app.post("/claude", async (req, res) => {
  try {
    // optional protection
    if (process.env.PROXY_TOKEN) {
      if (req.headers["x-proxy-token"] !== process.env.PROXY_TOKEN) {
        return res.status(401).json({ error: "unauthorized" });
      }
    }

    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": process.env.CLAUDE_API_KEY,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify(req.body)
    });

    const text = await r.text();
    res.status(r.status).type("application/json").send(text);
  } catch (e) {
    res.status(500).json({
      error: "proxy_error",
      message: String(e?.message || e)
    });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log("listening on", port));
