import { Router } from "express";
import { File, MetaData, Tag } from "../db.js";
import fileUpload from "express-fileupload";
import path from "path";
import * as logger from "../logger.js";
import * as mime from "mime-types";

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
router.get("/one/:fid", async (req, res) => {
	if (req.params.fid === undefined)
		return res.status(401).send({ ok: false, error: "no fileid" });

	let file = await File.findByPk(req.params.fid, { include: [Tag, MetaData] });

	if (file === undefined || file === null)
		return res.status(404).send({ ok: false, error: "no file with that id" });

	res.send(file);
});

router.post("/upload", async (req, res) => {
	try {
		if (!req.files) return res.send({ ok: false, error: "no files" });

		let file = req.files.file;
		let originalName = file.name;
		let fileHash = await hash(file.data);
		let fileType = mime.lookup(originalName);

		let savePath = path.join("files", fileHash);

		file.mv(savePath);

		let fileData = await File.build({
			name: originalName,
			path: savePath,
			hash: fileHash,
			size: file.size,
		}).save();

		let metaDataFileType = await MetaData.build({
			key: "mimeType",
			value: fileType,
			FileId: fileData.id,
		}).save();

		fileData.dataValues.MetaData = [metaDataFileType];

		res.send({ ok: true, file: fileData });
	} catch (err) {
		logger.error("FILEUPLOAD", err);
		res.send({ ok: false, error: err });
	}
});
router.put("/add-tag", async (req, res) => {
	const fileId = req.body.fileId;
	const tagName = req.body.tagName;

	let tagToAdd = await Tag.findOne({ where: { name: tagName } });

	let fileToAddTagTo = await File.findByPk(fileId);

	fileToAddTagTo.addTag(tagToAdd);

	res.send({ ok: true });
});
router.put("/remove-tag", async (req, res) => {
	const fileId = req.body.fileId;
	const tagName = req.body.tagName;

	let tagToRemove = await Tag.findOne({ where: { name: tagName } });

	let fileToRemoveTagFrom = await File.findByPk(fileId);

	fileToRemoveTagFrom.removeTag(tagToRemove);

	res.send({ ok: true });
});

router.put("/add-meta", async (req, res) => {
	const fileId = req.body.fileId;
	const metaKey = req.body.key;
	const metaValue = req.body.value;

	let MetaDatas = await MetaData.findAll({
		where: { key: metaKey, FileId: fileId },
	});
	if (MetaDatas.length != 0) {
		await MetaDatas[0].set("value", metaValue).save();
		return res.send(MetaDatas[0]);
	}
	let metaData = await MetaData.build({
		key: metaKey,
		value: metaValue,
		FileId: fileId,
	}).save();

	res.send(metaData);
});
router.put("/remove-meta", async (req, res) => {
	const fileId = req.body.fileId;
	const metaKey = req.body.key;

	await MetaData.destroy({ where: { FileId: fileId, key: metaKey } });

	res.send({ ok: true });
});

router.delete("/delete/:fid", async (req, res) => {
	if (req.params.fid === undefined)
		return res.status(401).send({ ok: false, error: "no fileid" });

	let fileid = req.params.fid;

	try {
		await MetaData.destroy({ where: { FileId: fileid } });
		await File.destroy({ where: { id: fileid } });
		res.send({ ok: true });
	} catch (err) {
		logger.error("FILEDELETE", err);
		res.status(500).send({ ok: false, error: err });
	}
});

export const filesRouter = router;
