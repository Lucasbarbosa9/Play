
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

async function connectTikTok() {
  const username = process.env.TIKTOK_USERNAME?.replace("@", "");

  if (!username) {
    console.log("Configure TIKTOK_USERNAME no Render.");
    return;
  }

  try {
    const connection = new TikTokLiveConnection(username);

    connection.on(WebcastEvent.CHAT, event => {
      io.emit("chat", {
        user: event.user?.uniqueId || "Visitante",
        message: event.content || ""
      });
    });

    await connection.connect();
    console.log("Conectado à LIVE de @" + username);
  } catch (error) {
    console.error("Erro ao conectar ao TikTok:", error);
  }
}

server.listen(process.env.PORT || 3000, "0.0.0.0", () => {
  console.log("Raposa Play online!");
  connectTikTok();
});
