import path from "path";
import fs from "fs";
import express from "express";
import cors from "cors";
import leadsRouter from "./routes/leads";
import fetchRouter from "./routes/fetch";
import emailRouter from "./routes/email";
import settingsRouter from "./routes/settings";

const app = express();
const PORT = process.env.PORT ?? 3001;

app.use(cors());
app.use(express.json());

app.use("/api/leads", leadsRouter);
app.use("/api/fetch", fetchRouter);
app.use("/api/email", emailRouter);
app.use("/api/settings", settingsRouter);

const publicDir = path.resolve(process.cwd(), "public");
if (fs.existsSync(publicDir)) {
  console.log(`Serving static files from ${publicDir}`);
  app.use(express.static(publicDir));
  app.get("*", (_req, res) => {
    res.sendFile(path.join(publicDir, "index.html"));
  });
} else {
  console.log(`No public dir at ${publicDir}, API-only mode`);
  app.get("*", (_req, res) => {
    res.status(404).json({ error: "Not found" });
  });
}

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

export default app;
