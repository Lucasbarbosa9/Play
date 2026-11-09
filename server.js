
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

let connection;

app.get("/connect", async (req, res) => {
  const username = String(req.query.user || "").replace("@", "");

  if (!/^[a-zA-Z0-9._]{2,24}$/.test(username)) {
    return res.status(400).send("Usuário inválido");
  }

  try {
    if (connection) await connection.disconnect();

    connection = new TikTokLiveConnection(username);

    connection.on(WebcastEvent.CHAT, event => {
      io.emit("chat", {
        user: event.user?.displayId || "Visitante",
        message: event.content || ""
      });
    });

    await connection.connect();
    res.send("Conectado à LIVE!");
  } catch (error) {
    console.error(error);
    res.status(500).send("Erro ao conectar à LIVE");
  }
});

app.get("/", (req, res) => {
  res.send("Raposa Play está funcionando!");
});

server.listen(process.env.PORT || 3000, "0.0.0.0");
