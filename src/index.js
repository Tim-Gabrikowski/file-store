import Express from "express";
import cors from "cors";
// environment vars
import dotenv from "dotenv";
dotenv.config();
// import DB-Module to init db connection
import "./db.js";
import * as logger from "./logger.js";

//routers
import { filesRouter } from "./routes/files.js";
import { tagsRouter } from "./routes/tags.js";
import { searchRouter } from "./routes/search.js";
import { downloadRouter } from "./routes/download.js";
import { authRouter } from "./routes/auth.js";

const app = Express();

app.use(Express.json());
app.use(Express.urlencoded({ extended: true }));

app.use(cors());

// use routers
app.use("/files", filesRouter);
app.use("/tags", tagsRouter);
app.use("/search", searchRouter);
app.use("/download", downloadRouter);
app.use("/auth", authRouter);

app.get("/", (erq, res) => {
	res.send({ ok: true });
});

app.listen(process.env.SERVER_PORT || 3030, () => {
	logger.info(
		"MAIN",
		"Server listening on http://localhost:" + (process.env.SERVER_PORT || 3030)
	);
});

process.on("uncaughtException", (error) => {
	logger.critical("MAIN", error);
});
