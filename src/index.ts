import express from "express";
import router from "./routes/api";
import bodyParser from "body-parser";
import cors from "cors";
const app = express();

app.use(
  cors({
    origin: "http://localhost:3000",
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
