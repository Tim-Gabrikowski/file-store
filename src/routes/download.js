import { Router } from "express";
import { File, Tag, MetaData } from "../db.js";
import * as logger from "../logger.js";
import { Op, where } from "sequelize";
import * as _ from "underscore";
import * as mime from "mime-types";

const router = Router();

router.get("/:id", async (req, res) => {
	const id = req.query.id;

	let file = File.findByPk(id);
});

export const downloadRouter = router;
