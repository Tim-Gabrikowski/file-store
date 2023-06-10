import { Router } from "express";
import { File, MetaData, Tag } from "../db.js";
import path from "path";
import * as logger from "../logger.js";
import * as mime from "mime-types";
import { authMiddleware } from "../middlewares/auth.js";
import multer from "multer";
import fs from "fs";

const router = Router();

import { createHash } from "crypto";

function hash(input) {
	return createHash("sha256").update(input).digest("hex");
}

router.get("", authMiddleware, (req, res) => {
	res.send({ ok: true });
});

router.get("/list", authMiddleware, async (req, res) => {
	let files = await File.findAll({ include: [Tag] });
	res.send(files);
});
router.get("/one/:fid", authMiddleware, async (req, res) => {
	if (req.params.fid === undefined)
		return res.status(401).send({ ok: false, error: "no fileid" });

	let file = await File.findByPk(req.params.fid, { include: [Tag, MetaData] });

	if (file === undefined || file === null)
		return res.status(404).send({ ok: false, error: "no file with that id" });

	res.send(file);
});

const upload = multer({ storage: multer.memoryStorage() });
router.post(
	"/upload",
	upload.single("file"),
	authMiddleware,
	async (req, res) => {
		try {
			if (!req.file)
				return res.status(400).send({ ok: false, error: "no files" });

			let file = req.file;
			let originalName = file.originalname;
			let fileHash = await hash(file.buffer);
			let fileType = mime.lookup(originalName);

			let savePath = path.join("files", fileHash);

			fs.writeFileSync(savePath, file.buffer);

			let fileData = await File.build({
				name: originalName,
				path: savePath,
				hash: fileHash,
				size: file.size,
				owner: req.user.tokenType + ":" + req.user.uuid,
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
	}
);
router.put("/add-tag", authMiddleware, async (req, res) => {
	const fileId = req.body.fileId;
	const tagName = req.body.tagName;

	let tagToAdd = await Tag.findOne({
		where: { name: tagName },
	});

	let fileToAddTagTo = await File.findByPk(fileId, { include: [Tag] });

	fileToAddTagTo.addTag(tagToAdd);

	res.send({ ok: true, file: fileToAddTagTo });
});
router.put("/remove-tag", authMiddleware, async (req, res) => {
	const fileId = req.body.fileId;
	const tagName = req.body.tagName;

	let tagToRemove = await Tag.findOne({ where: { name: tagName } });

	let fileToRemoveTagFrom = await File.findByPk(fileId);

	fileToRemoveTagFrom.removeTag(tagToRemove);

	res.send({ ok: true });
});

router.put("/add-meta", authMiddleware, async (req, res) => {
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
router.put("/remove-meta", authMiddleware, async (req, res) => {
	const fileId = req.body.fileId;
	const metaKey = req.body.key;

	await MetaData.destroy({ where: { FileId: fileId, key: metaKey } });

	res.send({ ok: true });
});

router.delete("/delete/:fid", authMiddleware, async (req, res) => {
	if (req.params.fid === undefined)
		return res.status(400).send({ ok: false, error: "no fileid" });

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
