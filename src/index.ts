import express from "express";
import router from "./routes/api";
import bodyParser from "body-parser";
import cors from "cors";
import env from "./utils/env";
const app = express();

app.use(
  cors({
    origin: env.FRONTEND_URL,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);
app.use(bodyParser.json());

const PORT = 5000;

router.get("/", (req, res) => {
  res.status(200).json({
    message: "Welcome to the API",
  });
});

app.use("/api", router);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
