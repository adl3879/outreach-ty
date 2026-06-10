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

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

export default app;
