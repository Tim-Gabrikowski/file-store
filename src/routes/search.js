import { Router } from "express";
import { File, Tag, MetaData } from "../db.js";
import * as logger from "../logger.js";
import { Op, where } from "sequelize";
import * as _ from "underscore";

const router = Router();

router.get("", async (req, res) => {
	let searchAttr = req.body;
	// Init collector array
	// will be a big array of arrays containing fileids that are found by the individual searches
	// will be filtered by AND or OR condition in the end (AND = File must meet all conditions; OR = at least one condition must be met)
	let fileIdCollector = [];

	// search by name search term
	if (searchAttr.name) {
		let filesByNameIds = [];

		// get all files with their names including the searchterm
		let files = await File.findAll({
			where: { name: { [Op.like]: "%" + searchAttr.name + "%" } },
			include: [Tag],
		});

		// filter out the ids
		filesByNameIds = files.map((f) => {
			return f.dataValues.id;
		});

		// add ids to collector
		fileIdCollector.push(filesByNameIds);
	}

	// search all files that have all given Tags
	if (searchAttr.hasTags) {
		// loop through all given Tags
		for (let tag of searchAttr.hasTags) {
			let dbTag;

			// get Tag by Id or by name (what is specified?)
			if (typeof tag == "number") {
				dbTag = await Tag.findByPk(tag);
			} else if (typeof tag == "string") {
				dbTag = await Tag.findOne({ where: { name: tag } });
			} else {
				break;
			}

			// init arrays
			let filesbt = [];
			let fileIds = [];

			// get all files from the tag
			filesbt = await dbTag.getFiles({
				include: [{ model: Tag, through: "FileTags" }],
			});

			// return only the file ids to array
			fileIds = filesbt.map((f) => {
				return f.dataValues.id;
			});

			// add FileIds to collector array
			fileIdCollector.push(fileIds);
		}
	}

	// filter collector array to only allow elements in all subarrays (AND Condition)
	let fileIdsMatchingConditions = _.intersection(...fileIdCollector);

	// get list of all files that match the condition
	let filesMatching = await File.findAll({
		where: { id: { [Op.in]: fileIdsMatchingConditions } },
		include: { model: Tag },
	});

	// send result
	res.send(filesMatching);
});

export const searchRouter = router;
