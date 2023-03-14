import http from "http";
import process from "process";
import WebSocket, { WebSocketServer as WSWebSocketServer } from "ws";
import { insource } from "./handlers.js";

const WebSocketServer = WebSocket.Server || WSWebSocketServer;

const NS_PER_SEC = 1e9;
const MS_PER_NS = 1e-6;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export default class Server {
  static wss = new WebSocketServer({ noServer: true });
  static routes = new Map();

  constructor(port, host) {
    this.port = port;
    this.host = host;

    Server.routes.set("GET", new Map());
    Server.routes.set("POST", new Map());
    Server.routes.set("PUT", new Map());
    Server.routes.set("DELETE", new Map());
  }

  #queryRoutes(requestType, slug) {
    let destinations = slug.split("/");
    if (destinations[0] == "") {
      destinations.shift();
    }

    let currentNode = Server.routes.get(requestType);
    for (const nextDest of destinations) {
      if (currentNode.get("/" + nextDest) === undefined) {
        throw new Error("Not Found");
      }
      currentNode = currentNode.get("/" + nextDest);
    }

    return currentNode;
  }

  listenAndServe(cb) {
    const requestListener = async (req, res) => {
      res.setHeader("Access-Control-Allow-Origin", "http://localhost:5500");
      res.setHeader("access-control-expose-headers", "Set-Cookie");
      res.setHeader("Access-Control-Allow-Credentials", "true");

      if (req.url !== "/favicon.ico") {
        try {
          const currentNode = this.#queryRoutes(req.method, req.url);

          let startTime;
          res.end = (data, encoding, callback) => {
            const diff = process.hrtime(startTime);
            const elapsedTotalTime = diff[0] * NS_PER_SEC + diff[1] * MS_PER_NS;

            const remainder = currentNode.profiler.currentlyElapsed;
            currentNode.metrics.en[0] = remainder;

            let totalNetworkTime = currentNode.metrics.en.reduce((a, b) => {
              return a + b;
            });
            const computeTime = elapsedTotalTime - totalNetworkTime;

            const routeTelemetry = JSON.stringify({
              slug: currentNode.slug,
              networkTimes: currentNode.metrics.en,
              computeTime,
            });

            res.setHeader(
              "Set-Cookie",
              `routeTelemetry=${routeTelemetry}; Path=/; Domain=localhost`
            );

            console.log(JSON.parse(routeTelemetry));
            currentNode.metrics.en = [];
            res.__proto__.end.call(res, data, encoding, callback);
          };

          currentNode.profiler.enable();
          await sleep(0);

          startTime = process.hrtime();
          await currentNode.cb(req, res);
        } catch (e) {
          if (e.message === "Not Found") {
            res.writeHead(404);
            res.end();
          } else {
            res.writeHead(400);
            res.end(e.message);
          }
        }
      }
    };
    this.server = http.createServer(requestListener);

    Server.wss.on("connection", (ws) => {
      Server.wss.on("error", console.error);

      ws.on("message", (data, _) => {
        insource(data, Server.routes, ws);
      });
    });

    this.server.on("upgrade", (request, socket, head) => {
      const pathname = request.url;

      if (pathname === "/") {
        Server.wss.handleUpgrade(request, socket, head, (ws) => {
          Server.wss.emit("connection", ws, request);
        });
      } else {
        socket.destroy();
      }
    });

    this.server.listen(this.port, this.host, cb);
  }
}
