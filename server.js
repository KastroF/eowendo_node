const http = require("http");
const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const app = require("./app");
const { setIO } = require("./socket");

const port = process.env.PORT || 3002;
app.set("port", port);

const server = http.createServer(app);

// Socket.io
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

// Auth middleware pour les sockets
io.use((socket, next) => {
  const token = socket.handshake.auth?.token;
  if (!token) {
    return next(new Error("Token manquant"));
  }
  try {
    const decoded = jwt.verify(token, process.env.CODETOKEN);
    socket.userId = decoded.userId;
    next();
  } catch (err) {
    next(new Error("Token invalide"));
  }
});

io.on("connection", (socket) => {
  console.log("Socket connecté:", socket.userId);

  // Rejoindre le room de l'agent
  socket.join(`agent_${socket.userId}`);

  socket.on("disconnect", () => {
    console.log("Socket déconnecté:", socket.userId);
  });
});

// Rendre io accessible aux controllers
setIO(io);

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
