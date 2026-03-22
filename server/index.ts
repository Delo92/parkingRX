import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { serveStatic } from "./static";
import { createServer } from "http";
import path from "path";
import { logError } from "./services/errorLogger";

const app = express();
const httpServer = createServer(app);

app.use("/uploads", express.static(path.resolve(process.cwd(), "uploads")));
app.use("/templates", express.static(path.resolve(process.cwd(), "public/templates")));

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

app.use(
  express.json({
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  }),
);

app.use(express.urlencoded({ extended: false }));

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  await registerRoutes(httpServer, app);

  app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    console.error("Internal Server Error:", err);

    logError({
      errorType: "system",
      severity: "critical",
      message,
      stackTrace: err.stack,
      endpoint: req.path,
      method: req.method,
      statusCode: status,
      userUid: (req as any).user?.id,
      userEmail: (req as any).user?.email,
      userLevel: (req as any).user?.userLevel ?? null,
      context: { name: err.name },
    }).catch(() => {});

    if (res.headersSent) {
      return next(err);
    }

    return res.status(status).json({ message });
  });

  process.on("uncaughtException", (err) => {
    console.error("Uncaught Exception:", err);
    logError({
      errorType: "system",
      severity: "critical",
      message: err.message || "Uncaught Exception",
      stackTrace: err.stack,
      context: { name: err.name },
    }).catch(() => {});
  });

  process.on("unhandledRejection", (reason: any) => {
    console.error("Unhandled Rejection:", reason);
    logError({
      errorType: "system",
      severity: "critical",
      message: reason?.message || String(reason) || "Unhandled Promise Rejection",
      stackTrace: reason?.stack,
      context: { name: reason?.name },
    }).catch(() => {});
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (process.env.NODE_ENV === "production") {
    serveStatic(app);
  } else {
    const { setupVite } = await import("./vite");
    await setupVite(httpServer, app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || "5000", 10);
  httpServer.listen(
    {
      port,
      host: "0.0.0.0",
      reusePort: true,
    },
    () => {
      log(`serving on port ${port}`);
    },
  );
})();
