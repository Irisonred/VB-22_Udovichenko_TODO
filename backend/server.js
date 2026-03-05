const express = require("express");
const routes = require("./routes");
const app = express();
const PORT = 3000;

app.use(express.json({ limit: '2kb' }));
app.use(express.urlencoded({ extended: true, limit: '2kb' }));

const rateLimit = {};
app.use((req, res, next) => {
  const ip = req.ip;
  const nowTime = Date.now();
  const queryTime = 60000;
  const maxRequests = 50;
  
  if (!rateLimit[ip]) {
    rateLimit[ip] = [];
  }
  
  rateLimit[ip] = rateLimit[ip].filter(time => nowTime - time < queryTime);
  
  if (rateLimit[ip].length >= maxRequests) {
    return res.status(429).json({ error: "Слишком много запросов, подождите минуту" });
  }
  
  rateLimit[ip].push(nowTime);
  next();
});

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  
  next();
});

app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  console.log("Body:", req.body);
  next();
});

app.use("/tasks", routes);

app.get("/", (req, res) => {
  res.json({ status: "TODO Backend работает", endpoints: ["/tasks"] });
});

app.use((req, res) => {
  res.status(404).json({ error: "Endpoint not found" });
});

app.listen(PORT, () => {
  console.log(`Сервер запущен: http://localhost:${PORT}`);
});