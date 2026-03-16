import express from "express";
import fs from "fs";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";
import authRoutes from "./routes/authRoutes.js";
import connectDB from "./config/db.js";
import skinRoutes from "./routes/skinRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";

dotenv.config();
console.log("🚀 Server script initiated...");

// Global Debug Logger
const logError = (err) => {
  const msg = `\n[${new Date().toISOString()}] ${err.name}: ${err.message}\nStack: ${err.stack}\n`;
  fs.appendFileSync("server_error_detailed.log", msg);
};

process.on('uncaughtException', logError);
process.on('unhandledRejection', logError);

const app = express();
try {
  connectDB();
} catch (e) {
  logError(e);
}
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Request logger
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    const log = `[${new Date().toISOString()}] ${req.method} ${req.url} ${res.statusCode} - ${duration}ms\n`;
    fs.appendFileSync("server_requests.log", log);
  });
  next();
});

// Optional performance/security middlewares (dynamically imported so server won't crash if not installed)
(async () => {
  try {
    const compressionMod = await import('compression');
    const compression = compressionMod.default || compressionMod;
    app.use(compression());
    console.log('✅ compression enabled');
  } catch (e) {
    console.warn('⚠️ compression module not installed — skip compression');
  }

  try {
    const helmetMod = await import('helmet');
    const helmet = helmetMod.default || helmetMod;
    app.use(helmet());
    console.log('✅ helmet enabled');
  } catch (e) {
    console.warn('⚠️ helmet module not installed — skip security headers');
  }
})();

app.use("/api/auth", authRoutes);
app.use("/api/skin", skinRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/products", productRoutes);
app.use("/api/payment", paymentRoutes);
app.get("/", (req, res) => {
  res.send("Backend API is running 🚀");
});

// Serve frontend production build when present
const __dirname = path.resolve();
const frontendDist = path.join(__dirname, '..', 'style-ai-main', 'dist');
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(frontendDist, {
    maxAge: '7d',
    setHeaders: (res, filePath) => {
      // Long cache for static assets
      if (filePath.endsWith('.html')) {
        res.setHeader('Cache-Control', 'no-cache');
      } else {
        res.setHeader('Cache-Control', 'public, max-age=604800, immutable');
      }
    }
  }));

  app.get('*', (req, res) => {
    res.sendFile(path.join(frontendDist, 'index.html'));
  });
}

const PORT = process.env.PORT || 5000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
  fs.writeFileSync("server_ready.log", `Server successfully started at ${new Date().toISOString()} on port ${PORT}`);
});

export default app;
