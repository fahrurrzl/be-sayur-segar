import express from "express";
import router from "./routes/api";
import bodyParser from "body-parser";

const app = express();

app.use(bodyParser.json());

const PORT = 3000;

app.use("/api", router);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
