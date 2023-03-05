import http from "http";
import WebSocket, { WebSocketServer as WSWebSocketServer } from "ws";
import { onMessage } from "./handlers.js";

const WebSocketServer = WebSocket.Server || WSWebSocketServer;

export default class Server {
  static wss = new WebSocketServer({ noServer: true });
  static routes = {
    GET: {},
    POST: {},
    DELETE: {},
  };

  constructor(port, host) {
    this.port = port;
    this.host = host;
    this.sockets = {};
  }

  async queryRoutes(requestType, branch, networkLatencyMbps) {
    let destinations = branch.split("/");
    if (destinations[0] == "") {
      destinations.shift();
    }

    let currentNode = Server.routes[requestType];
    for (const nextDest of destinations) {
      if (currentNode["/" + nextDest] === undefined) {
        throw new Error("Not Found");
      }
      currentNode = currentNode["/" + nextDest];
    }
    let thresholds = await currentNode.thresholds;

    let shouldInsource = false;
    if (networkLatencyMbps < thresholds.latency) {
      shouldInsource = true;
    }

    return [currentNode, shouldInsource ? branch : null];
  }

  parseCookies(req) {
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
          // const networkLatencyMbps = this.parseCookies(req);
          const networkLatencyMbps = 15;

          console.log(
            "Network latency on request (Mbps): " + networkLatencyMbps
          );

          const [currentNode, branch] = await this.queryRoutes(
            req.method,
            req.url,
            networkLatencyMbps
          );

          res.setHeader(
            "Set-Cookie",
            `insourceBranch=${branch}; Path=/; Domain=localhost`
          );

          currentNode.metrics["timeElapsed"] = 0;

          currentNode.profiler.enable();
          await currentNode.cb(req, res);

          console.log(currentNode);
        } catch (e) {
          if (e.message === "Not Found") {
            res.writeHead(404);
          }
        }
      }
    };

    this.server = http.createServer(requestListener);

    Server.wss.on("connection", function connection(ws) {
      Server.wss.on("error", console.error);

      ws.on("message", (data, _) => {
        onMessage(data, this.routes, ws);
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
