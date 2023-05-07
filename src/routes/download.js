import { Router } from "express";
import { File, Tag, MetaData } from "../db.js";
import * as _ from "underscore";

const router = Router();

router.get("/:id", async (req, res) => {
	const id = req.params.id;
	let file = await File.findByPk(id);
	if (!file) return res.sendStatus(404);
	const filepath = file.dataValues.path;
	res.download(filepath, file.name);
});

export const downloadRouter = router;
