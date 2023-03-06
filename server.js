import http from "http";
import process from "process";
import WebSocket, { WebSocketServer as WSWebSocketServer } from "ws";
import { onMessage } from "./handlers.js";

const WebSocketServer = WebSocket.Server || WSWebSocketServer;

const NS_PER_SEC = 1e9;
const MS_PER_NS = 1e-6;

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

  #queryRoutes(requestType, branch, networkLatencyMbps) {
    let destinations = branch.split("/");
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
    let thresholds = currentNode.thresholds;

    let shouldInsource = false;
    if (networkLatencyMbps < thresholds.latency) {
      shouldInsource = true;
    }

    return [currentNode, shouldInsource ? branch : null];
  }

  #parseCookies(req) {
    let networkLatencyMbps;

    let cookieHeaders = req.headers?.cookie.split("; ");
    for (const cookieHeader of cookieHeaders) {
      let cookie = cookieHeader.split("=");
      if (cookie[0] === "avgLatency") {
        networkLatencyMbps = parseFloat(cookie[1]);
      }
    }
    return networkLatencyMbps;
  }

  listenAndServe(cb) {
    const requestListener = async (req, res) => {
      res.setHeader("Access-Control-Allow-Origin", "http://localhost:3000");
      res.setHeader("Access-Control-Allow-Credentials", "true");
      res.setHeader("Content-Type", "application/json");

      if (req.url !== "/favicon.ico") {
        try {
          // const networkLatencyMbps = this.#parseCookies(req);
          const [currentNode, branch] = this.#queryRoutes(
            req.method,
            req.url,
            15
          );
          let startTime;

          res.end = (data, encoding, callback) => {
            const diff = process.hrtime(startTime);
            const endTime = diff[0] * NS_PER_SEC + diff[1] * MS_PER_NS;

            const elapsedNetworkTime = currentNode.metrics["timeElapsed"];
            currentNode.metrics["tn"] += elapsedNetworkTime;
            currentNode.metrics["tc"] += endTime - elapsedNetworkTime;

            const avgElapsedNetworkTime = parseFloat(
              (currentNode.metrics["tn"] / currentNode.metrics["en"]).toFixed(2)
            );

            const avgElapsedComputeTime = parseFloat(
              (currentNode.metrics["tc"] / currentNode.metrics["en"]).toFixed(2)
            );

            res.setHeader(
              "Set-Cookie",
              `insourceBranch=${branch}; Path=/; Domain=localhost`
            );

            console.log({
              avgElapsedNetworkTime,
              avgElapsedComputeTime,
            });

            res.__proto__.end.call(res, data, encoding, callback);
          };

          currentNode.metrics["timeElapsed"] = 0;
          currentNode.metrics["en"] += 1;

          currentNode.profiler.enable();

          startTime = process.hrtime();
          await currentNode.cb(req, res);
        } catch (e) {
          if (e.message === "Not Found") {
            res.writeHead(404);
            res.end();
          }
        }
      }
    };
    this.server = http.createServer(requestListener);

    Server.wss.on("connection", function connection(ws) {
      Server.wss.on("error", console.error);

      ws.on("message", (data, _) => {
        onMessage(data, Server.routes, ws);
      });
    });

    this.server.on("upgrade", function upgrade(request, socket, head) {
      const pathname = request.url;

      if (pathname === "/") {
        Server.wss.handleUpgrade(request, socket, head, function done(ws) {
          Server.wss.emit("connection", ws, request);
        });
      } else {
        socket.destroy();
      }
    });

    this.server.listen(this.port, this.host, cb);
  }
}
