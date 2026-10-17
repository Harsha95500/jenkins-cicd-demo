const http = require("node:http");

const server = http.createServer((req, res) => {
  res.setHeader("Content-Type", "application/json");

  if (req.url === "/health") {
    res.writeHead(200);
    return res.end(JSON.stringify({ status: "ok" }));
  }

  if (req.url === "/") {
    res.writeHead(200);
    return res.end(JSON.stringify({ app: "jenkins-cicd-demo" }));
  }

  res.writeHead(404);
  res.end(JSON.stringify({ error: "Not found" }));
});

const port = Number(process.env.PORT || 3000);

server.listen(port, "0.0.0.0", () => {
  console.log(`Demo app listening on port ${port}`);
});
