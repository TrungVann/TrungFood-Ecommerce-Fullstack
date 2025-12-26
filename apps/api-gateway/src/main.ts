/**
 * =====================================================================
 * API GATEWAY - EXPRESS
 * =====================================================================
 * Vai trò:
 * - Là cổng trung tâm (entry point cho toàn bộ hệ thống microservices)
 * - Xử lý các vấn đề cross-cutting:
 * + CORS
 * + Logging
 * + Rate limitting
 * + Proxy request đến từng service
 * + Health check
 * + Graceful shutdown
 *
 * Môi trường hỗ trợ:
 * - Development: chạy local (localhost)
 * - Production: chạy trong Docker + Nginx
 * ======================================================================
 */

import express from "express";
import cors from "cors";
import proxy from "express-http-proxy";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import cookieParser from "cookie-parser";
import initializeSiteConfig from "./libs/initializeSiteConfig";

const app = express();

/**
 * Xác định môi trường:
 * - production: chạy trên server/docker
 * - development: chạy local
 */
const isProduction = process.env.NODE_ENV === "production";

/**
 * CORS configuration
 * - production: chỉ cho phép domain chính thức
 * - development: cho phép localhost các app frontend
 *
 * credentials: true -> cho phép gửi cookie/auth header
 */
const allowedOrigins = isProduction
  ? [
      "https://shondhane.com",
      "https://sellers.shondhane.com",
      "https://admin.shondhane.com",
      "http://nginx",
      "http://localhost",
    ]
  : ["http://localhost:3000", "http://localhost:3001", "http://localhost:3002"];

app.use(
  cors({
    origin: allowedOrigins,
    allowedHeaders: ["Authorization", "Content-Type", "X-Requested-With"],
    credentials: true,
  })
);

/**
 * LOGGING
 * - dev: log gọn, dễ đọc
 * - production: log chuẩn để tích hợp monitoring
 */
app.use(morgan(isProduction ? "combined" : "dev"));

/**
 * BODY PARSING
 * - Giới hạn 50MB để tránh payload quá lớn gây DoS
 */
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

/**
 * COOKIE PARSER
 * - Dùng cho auth bằng cookie / refresh token
 */
app.use(cookieParser());

/**
 * TRUST PROXY
 * - production: chạy sau ngix/load balancer
 * - cho phép Express đọc đúng IP thật từ header
 */
app.set("trust proxy", isProduction ? "loopback" : 1);

/**
 * RATE LIMITING (GLOBAL)
 * - Chống spam/DDoS nhẹ
 * - Auth chi tiết sẽ do từng service xử lý
 * - Bỏ qua health check
 */
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Simplified rate limit - auth should be handled by individual services
  message: { error: "Too many requests, please try again later!" },
  standardHeaders: true,
  legacyHeaders: false, // Disable legacy headers in production
  keyGenerator: (req: any) => req.ip,
  skip: (req) => {
    // Skip rate limiting for health checks
    return req.path === "/gateway-health";
  },
});

app.use(limiter);

/**
 * HEALTH CHECK ENDPOINT
 * - Dùng cho monitoring, Docker, Kubernetes
 */
app.get("/gateway-health", (req, res) => {
  res.status(200).json({
    message: "API Gateway is healthy!",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
  });
});

/**
 * SERVICE URL RESOLVER
 * - Production: dùng Docker service name
 * - Development: dùng localhost
 */
const getServiceUrl = (serviceName: string, port: number) => {
  if (isProduction) {
    // Use Docker service names in production
    return `http://${serviceName}:${port}`;
  } else {
    // Use localhost for development
    return `http://localhost:${port}`;
  }
};

/**
 * PROXY MIDDLEWARE FACTORY
 * - Forward request từ Gateway đến microservice
 * - Thêm header:
 * + X-Forwarded-For: IP thật của client
 * + X-Original-Host: domain gốc
 * - Handle lỗi khi service chết
 */
const createProxyMiddleware = (serviceUrl: string, serviceName: string) => {
  return proxy(serviceUrl, {
    timeout: 30000, // 30 second timeout
    proxyReqOptDecorator: (
      proxyReqOpts: { headers: any },
      srcReq: { ip: any; get: (arg0: string) => any }
    ) => {
      // Forward original IP for proper rate limiting in downstream services
      proxyReqOpts.headers!["X-Forwarded-For"] = srcReq.ip;
      proxyReqOpts.headers!["X-Original-Host"] = srcReq.get("host");
      return proxyReqOpts;
    },
    proxyErrorHandler: (
      err: { message: any },
      res: {
        headersSent: any;
        status: (arg0: number) => {
          (): any;
          new (): any;
          json: {
            (arg0: { error: string; service: string; timestamp: string }): void;
            new (): any;
          };
        };
      },
      next: any
    ) => {
      console.error(`Proxy error for ${serviceName}:`, err.message);
      if (!res.headersSent) {
        res.status(503).json({
          error: "Service temporarily unavailable",
          service: serviceName,
          timestamp: new Date().toISOString(),
        });
      }
    },
  });
};

/**
 * ROUTE MAPPING -> MICROSERVICE
 * Gateway chỉ routing, không chứa business logic
 */
app.use(
  "/recommendation",
  createProxyMiddleware(
    getServiceUrl("recommendation-service", 6007),
    "recommendation-service"
  )
);

app.use(
  "/chatting",
  createProxyMiddleware(
    getServiceUrl("chatting-service", 6006),
    "chatting-service"
  )
);

app.use(
  "/admin",
  createProxyMiddleware(getServiceUrl("admin-service", 6005), "admin-service")
);

app.use(
  "/order",
  createProxyMiddleware(getServiceUrl("order-service", 6004), "order-service")
);

app.use(
  "/seller",
  createProxyMiddleware(getServiceUrl("seller-service", 6003), "seller-service")
);

app.use(
  "/product",
  createProxyMiddleware(
    getServiceUrl("product-service", 6002),
    "product-service"
  )
);

// Add this before the default route
app.use(
  "/auth",
  createProxyMiddleware(getServiceUrl("auth-service", 6001), "auth-service")
);

/**
 * GLOBAL ERROR HANDLER
 * - Bắt mọi lỗi chưa xử lý
 * - Production: không expose chi tiết lỗi
 */
app.use(
  (
    err: any,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    console.error("Global error handler:", err);

    if (!res.headersSent) {
      res.status(500).json({
        error: isProduction ? "Internal server error" : err.message,
        timestamp: new Date().toISOString(),
      });
    }
  }
);

/** 404 HANDLER */
app.use("*", (req, res) => {
  res.status(404).json({
    error: "Route not found",
    path: req.originalUrl,
    timestamp: new Date().toISOString(),
  });
});

/** SERVER STARTUP */
const port = process.env.PORT || 8080;
const host = isProduction ? "0.0.0.0" : "localhost";

const server = app.listen(Number(port), host, () => {
  console.log(`🚀 API Gateway listening at http://${host}:${port}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(`🔗 CORS Origins: ${JSON.stringify(allowedOrigins)}`);

  try {
    initializeSiteConfig();
    console.log("✅ Site config initialized successfully!");
  } catch (error) {
    console.error("❌ Failed to initialize site config:", error);
  }
});

/**
 * GRACEFUL SHUTDOWN
 * - Đảm bảo server đóng kết nối an toàn
 */
process.on("SIGTERM", () => {
  console.log("🛑 SIGTERM received, shutting down gracefully");
  server.close(() => {
    console.log("✅ Process terminated");
    process.exit(0);
  });
});

process.on("SIGINT", () => {
  console.log("🛑 SIGINT received, shutting down gracefully");
  server.close(() => {
    console.log("✅ Process terminated");
    process.exit(0);
  });
});

/**SERVER ERROR HANDLING */
server.on("error", (error: any) => {
  console.error("❌ Server error:", error);
  if (error.code === "EADDRINUSE") {
    console.error(`Port ${port} is already in use`);
    process.exit(1);
  }
});
