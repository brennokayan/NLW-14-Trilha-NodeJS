import fastify from "fastify";
import { Routes } from "./routes/routes";
import cookie from "@fastify/cookie";
import websocket from "@fastify/websocket";
const app = fastify();
app.register(cookie, {
  secret: "poll-app-nlw",
  hook: 'onRequest',
})

app.register(websocket)
app.register(Routes)

app
  .listen({
    host: "0.0.0.0",
    port: process.env.PORT ? parseInt(process.env.PORT) : 3333,
  })
  .then(() => {
    console.log("Server is running with sucefuly!");
  });
