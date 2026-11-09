
import express from "express";
import http from "http";
import { Server } from "socket.io";
import {
  TikTokLiveConnection,
  WebcastEvent
} from "tiktok-live-connector";

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static("public"));

const PORT = process.env.PORT || 3000;
const username = (process.env.TIKTOK_USERNAME || "")
  .replace("@", "")
  .trim();

let connection;

app.get("/health", (req, res) => {
  res.json({ online: true, tiktokConfigured: Boolean(username) });
});

async function connectTikTok() {
  if (!username) {
    console.log("Configure TIKTOK_USERNAME no Render.");
    return;
  }

  try {
    connection = new TikTokLiveConnection(username);

    connection.on(WebcastEvent.CHAT, event => {
      io.emit("chat", {
        user: event.user?.uniqueId || event.user?.nickname || "Visitante",
        message: event.content || ""
      });
    });

    connection.on(WebcastEvent.GIFT, event => {
      const giftName =
        event.giftDetails?.giftName || "presente";

      const user =
        event.user?.uniqueId || event.user?.nickname || "Visitante";

      io.emit("gift", {
        user,
        gift: giftName
      });

      console.log(`${user} enviou: ${giftName}`);
    });

    await connection.connect();

    console.log("Conectado à LIVE de @" + username);
    io.emit("tiktok-status", { connected: true });
  } catch (error) {
    console.error("Erro ao conectar ao TikTok:", error.message);
    io.emit("tiktok-status", { connected: false });
  }
}

io.on("connection", socket => {
  socket.emit("server-status", { online: true });
});

server.listen(PORT, "0.0.0.0", () => {
  console.log("Raposa Play online na porta " + PORT);
  connectTikTok();
});
