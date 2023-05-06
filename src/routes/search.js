import { Router } from "express";
import { File, Tag, MetaData } from "../db.js";
import * as logger from "../logger.js";
import { Op, where } from "sequelize";

const router = Router();

router.get("", async (req, res) => {
	let searchAttr = req.body;
	let whereSearch = {};
	let tagsWhere = {};
	if (searchAttr.name) {
		whereSearch.name = { [Op.like]: "%" + searchAttr.name + "%" };
	}
	let tagNames = [];
	let tagIds = [];
	if (searchAttr.hasTags) {
		for (let tag of searchAttr.hasTags) {
			if (typeof tag == "number") {
				tagIds.push(tag);
			} else if (typeof tag == "string") {
				tagNames.push(tag);
			}
		}
		console.log(searchAttr.hasTags);
		whereSearch["$Tags.FileTags.TagId$"] = { [Op.and]: tagIds };
	}
	let files = await File.findAll({
		where: whereSearch,
		include: [Tag],
	});
	res.send(files);
});

export const searchRouter = router;
