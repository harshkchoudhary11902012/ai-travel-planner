import "dotenv/config";

import express from "express";
import cors from "cors";
import morgan from "morgan";
import mongoose from "mongoose";

import authRouter from "./routes/auth";
import tripsRouter from "./routes/trips";

const app = express();
const PORT = Number(process.env.PORT || 4000);
const MONGODB_URI = process.env.MONGODB_URI;
const CORS_ORIGIN = process.env.CORS_ORIGIN;

if (!MONGODB_URI) {
	console.error("Missing MONGODB_URI");
	process.exit(1);
}

app.use(
	cors({
		origin: (origin, callback) => {
			// Non-browser requests (e.g. curl) have no Origin header.
			if (!origin) return callback(null, true);
			if (!CORS_ORIGIN) return callback(null, true);

			const allowed = CORS_ORIGIN.split(",")
				.map((s) => s.trim())
				.filter(Boolean);
			if (allowed.includes(origin)) return callback(null, true);
			return callback(new Error("CORS origin not allowed"), false);
		},
		credentials: true,
	}),
);
app.use(express.json());
app.use(morgan("dev"));

app.get("/", (_req, res) => {
	res.json({
		ok: true,
		service: "ai-travel-planner-api",
		health: "/api/health",
		hint: "The API lives under /api (e.g. /api/health, /api/auth, /api/trips).",
	});
});

app.get("/api/health", (_req, res) => {
	const dbConnected = mongoose.connection.readyState === 1;
	res.json({
		ok: true,
		database: dbConnected ? "connected" : "not connected",
	});
});

app.use("/api/auth", authRouter);
app.use("/api/trips", tripsRouter);

app.use((_req, res) => res.status(404).json({ error: "Not found" }));

// Central error handler to avoid leaking internals.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use(
	(err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
		console.error("Unhandled error:", err);
		res.status(500).json({ error: "Server error" });
	},
);

async function start() {
	await mongoose.connect(MONGODB_URI!, {
		serverSelectionTimeoutMS: 30000,
	});

	app.listen(PORT, () => {
		console.log(`API listening on port ${PORT}`);
	});
}

start().catch((err) => {
	console.error("Startup error:", err);
	process.exit(1);
});
