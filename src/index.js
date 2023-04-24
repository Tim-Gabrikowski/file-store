import Express from "express";
import cors from "cors";
// environment vars
import dotenv from "dotenv";
// import DB-Module to init db connection
import "./db.js";
import * as logger from "./logger.js";

//routers
import { filesRouter } from "./routes/files.js";

dotenv.config();

const app = Express();

app.use(cors());

// use routers
app.use("/files", filesRouter);

app.get("/", (erq, res) => {
	res.send({ ok: true });
});

app.listen(process.env.SERVER_PORT, () => {
	logger.info(
		"MAIN",
		"Server listening on http://localhost:" + process.env.SERVER_PORT
	);
});
