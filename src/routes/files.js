import { Router } from "express";
import { File } from "../db.js";
import fileUpload from "express-fileupload";
import path from "path";
import * as logger from "../logger.js";

const router = Router();

import { createHash } from "crypto";

function hash(input) {
	return createHash("sha256").update(input).digest("hex");
}

router.use(
	fileUpload({
		createParentPath: true,
	})
);

router.get("", (req, res) => {
	res.send({ ok: true });
});

router.get("/list", async (req, res) => {
	let files = await File.findAll();
	res.send(files);
});

router.post("/upload", async (req, res) => {
	try {
		if (!req.files) return res.send({ ok: false, error: "no files" });

		let file = req.files.file;
		let originalName = file.name;
		let fileHash = await hash(file.data);

		let savePath = path.join("files", fileHash);

		file.mv(savePath);

		let fileData = await File.build({
			name: originalName,
			path: savePath,
			hash: fileHash,
			size: file.size,
		}).save();

		res.send({ ok: true, file: fileData });
	} catch (err) {
		logger.error("FILEUPLOAD", err);
		res.send({ ok: false, error: err });
	}
});

export const filesRouter = router;
