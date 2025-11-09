import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import morgan from "morgan";
import "dotenv/config";
import path from "path";
import { fileURLToPath } from "url";
import jwt from "jsonwebtoken";

import { connectDB } from "./config/db.js";
import apiRouter from "./routes/index.js";

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });
const users = new Map();

// Middlewares
app.use(cors());
app.use(morgan("dev"));
app.use(express.json());

// Static frontend (src/public)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PUBLIC_DIR = path.join(__dirname, "public");
app.use(express.static(PUBLIC_DIR));
app.get("/", (_req, res) => res.sendFile(path.join(PUBLIC_DIR, "index.html")));

// API
app.use("/api", apiRouter);

// Socket.IO con JWT
io.use((socket, next) => {
  try {
    const token =
      socket.handshake.auth?.token ||
      socket.handshake.headers?.authorization?.replace("Bearer ", "");
    if (!token) return next(new Error("No token"));
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    socket.data.user = { id: payload.id, email: payload.email, role: payload.role };
    next();
  } catch {
    next(new Error("Invalid token"));
  }
});

io.on("connection", (socket) => {
  const user = socket.data.user;
  const palette = ["#60a5fa","#f472b6","#34d399","#fbbf24","#c084fc","#f87171","#38bdf8"];
  const color = palette[Math.floor(Math.random() * palette.length)];

  users.set(socket.id, { ...user, color, name: user.email.split("@")[0] });

  io.emit("userCount", users.size);
  socket.broadcast.emit("system", {
    type: "join",
    user: users.get(socket.id).name,
    color,
    at: new Date().toISOString(),
  });

  socket.on("chat:message", (text) => {
    const u = users.get(socket.id);
    io.emit("chat:message", {
      user: u.name,
      text,
      color: u.color,
      at: new Date().toISOString(),
      senderId: socket.id,
    });
  });

  socket.on("typing", () => {
    const u = users.get(socket.id);
    socket.broadcast.emit("typing", u.name);
  });

  socket.on("disconnect", () => {
    const u = users.get(socket.id);
    users.delete(socket.id);
    io.emit("userCount", users.size);
    socket.broadcast.emit("system", {
      type: "leave",
      user: u?.name,
      color: u?.color,
      at: new Date().toISOString(),
    });
  });
});

// Start
await connectDB();
const PORT = process.env.PORT || 4000;
server.listen(PORT, () => console.log(`🚀 API/WS http://localhost:${PORT}`));
