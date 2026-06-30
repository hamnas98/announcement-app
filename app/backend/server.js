import "@shopify/shopify-api/adapters/node";
import "dotenv/config";
import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import connectDB from "./src/config/db.js";
import shopify from "./src/config/shopify.js";
import { getSessionStorage } from "./src/config/sessionStorage.js";
import announcementRoutes from "./src/routes/announcementRoutes.js";
import { requestLogger } from "./src/middlewares/requestLogger.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const sessionStorage = getSessionStorage();

connectDB();

// ─── 1. Iframe Security Headers ───────────────────────────────
app.use((req, res, next) => {
	res.removeHeader("X-Frame-Options");
	res.setHeader(
		"Content-Security-Policy",
		"frame-ancestors https://admin.shopify.com https://*.myshopify.com",
	);
	next();
});

// ─── 2. OAuth Routes ──────────────────────────────────────────
app.get("/api/auth", async (req, res) => {
	await shopify.auth.begin({
		shop: shopify.utils.sanitizeShop(req.query.shop, true),
		callbackPath: "/api/auth/callback",
		isOnline: false,
		rawRequest: req,
		rawResponse: res,
	});
});

app.get("/api/auth/callback", async (req, res) => {
	try {
		const { session } = await shopify.auth.callback({
			rawRequest: req,
			rawResponse: res,
		});

		await sessionStorage.storeSession(session);
		console.log(`✅ OAuth complete — shop: ${session.shop}`);

		const host = req.query.host;
		res.redirect(`/?shop=${session.shop}&host=${host}`);
	} catch (error) {
		console.error("❌ OAuth callback failed:", error.message);
		res.status(500).send(`OAuth error: ${error.message}`);
	}
});

// ─── 3. Standard Middleware ───────────────────────────────────
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(requestLogger);

// ─── 4. Session Verification Middleware ───────────────────────
app.use("/api/*", async (req, res, next) => {
	try {
		const authHeader = req.headers.authorization;

		if (!authHeader?.startsWith("Bearer ")) {
			return res.status(401).json({
				error: "Missing Authorization header",
			});
		}

		const sessionToken = authHeader.replace("Bearer ", "").trim();
		const payload = await shopify.session.decodeSessionToken(sessionToken);
		const shopDomain = payload.dest.replace("https://", "");
		const sessionId = `offline_${shopDomain}`;
		const session = await sessionStorage.loadSession(sessionId);

		if (!session) {
			return res.status(401).json({
				error: "Session not found — app may need to be reinstalled",
				shop: shopDomain,
			});
		}

		res.locals.shopify = { session };
		next();
	} catch (error) {
		console.error("Session verification failed:", error.message);
		return res
			.status(401)
			.json({ error: "Invalid or expired session token" });
	}
});

// ─── 5. API Routes ────────────────────────────────────────────
app.use("/api", announcementRoutes);

// ─── 6. Health Check ──────────────────────────────────────────
app.get("/health", (req, res) => {
	res.json({
		status: "ok",
		message: "Announcement App Backend Running",
		timestamp: new Date().toISOString(),
	});
});

// ─── 7. Serve React Frontend (Production Only) ────────────────

if (process.env.NODE_ENV === "production") {
	const frontendPath = path.join(__dirname, "../frontend/dist");
	app.use(express.static(frontendPath));

	app.get(/.*/, (req, res) => {
		res.sendFile(path.join(frontendPath, "index.html"));
	});
}

// ─── 8. Global Error Handler ───────────────────────────────────
app.use((err, req, res, next) => {
	console.error("❌ Server Error:", err.stack);
	res.status(500).json({
		error: "Internal server error",
		message: err.message,
	});
});

// ─── 9. Start Server ────────────────────────────────────────────
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
	console.log(`🚀 Backend running on port ${PORT}`);
	console.log(`📊 Health check: http://localhost:${PORT}/health`);
});
