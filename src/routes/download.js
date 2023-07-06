import { Router } from "express";
import { File, Tag, MetaData } from "../db.js";
import * as fs from "fs";

const router = Router();

router.get("/:id", async (req, res) => {
	const id = req.params.id;

	let file = await File.findByPk(id);
	if (!file) return res.sendStatus(404);

	file.increment("downloaded", { by: 1 });

	const filepath = file.dataValues.path;
	res.download(filepath, file.name);
});

router.get("/stream/:id", async (req, res) => {
	const id = req.params.id;

	let file = await File.findByPk(id);
	if (!file) return res.sendStatus(404);

	file.increment("streamed", { by: 1 });

	let mimeTypeMeta = await MetaData.findOne({
		where: {
			key: "mimeType",
			FileId: file.dataValues.id,
		},
	});
	let mimeType = mimeTypeMeta.dataValues.value;

	var filepath = file.dataValues.path;

	var stat = fs.statSync(filepath);
	let range = req.headers.range;
	var readStream;

	if (range !== undefined) {
		var parts = range.replace(/bytes=/, "").split("-");

		var partial_start = parts[0];
		var partial_end = parts[1];

		if (
			(isNaN(partial_start) && partial_start.length > 1) ||
			(isNaN(partial_end) && partial_end.length > 1)
		) {
			return res.sendStatus(500); //ERR_INCOMPLETE_CHUNKED_ENCODING
		}

		var start = parseInt(partial_start, 10);
		var end = partial_end ? parseInt(partial_end, 10) : stat.size - 1;
		var content_length = end - start + 1;

		res.status(206).header({
			"Content-Type": mimeType,
			"Content-Length": content_length,
			"Content-Range": "bytes " + start + "-" + end + "/" + stat.size,
		});

		readStream = fs.createReadStream(filepath, { start: start, end: end });
	} else {
		res.header({
			"Content-Type": mimeType,
			"Content-Length": stat.size,
		});
		readStream = fs.createReadStream(filepath);
	}
	readStream.pipe(res);
});

export const downloadRouter = router;
