const http = require("http");
const app = require("./app");

const port = process.env.PORT || 3002;
app.set("port", port);

const server = http.createServer(app);

server.on("error", (error) => {
  if (error.syscall !== "listen") throw error;
  if (error.code === "EACCES") {
    console.error(`Port ${port} requires elevated privileges`);
    process.exit(1);
  } else if (error.code === "EADDRINUSE") {
    console.error(`Port ${port} is already in use`);
    process.exit(1);
  } else {
    throw error;
  }
});

server.on("listening", () => {
  console.log(`Serveur eOwendo démarré sur le port ${port}`);
});

server.listen(port);
