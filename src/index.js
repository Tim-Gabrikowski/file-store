import Express from "express";
import cors from "cors";
// environment vars
import dotenv from "dotenv";
// import DB-Module to init db connection
import "./db.js";
import * as logger from "./logger.js";

//routers
import { filesRouter } from "./routes/files.js";
import { tagsRouter } from "./routes/tags.js";
import { searchRouter } from "./routes/search.js";

dotenv.config();

const app = Express();

app.use(Express.json());

app.use(cors());

// use routers
app.use("/files", filesRouter);
app.use("/tags", tagsRouter);
app.use("/search", searchRouter);

app.get("/", (erq, res) => {
	res.send({ ok: true });
});

app.listen(process.env.SERVER_PORT || 3030, () => {
	logger.info(
		"MAIN",
		"Server listening on http://localhost:" + (process.env.SERVER_PORT || 3030)
	);
});
