import { Router } from "express";
import { File, Tag, MetaData } from "../db.js";
import * as logger from "../logger.js";
import { Op, where } from "sequelize";
import * as _ from "underscore";
import * as mime from "mime-types";

const router = Router();

router.get("", async (req, res) => {
	let searchAttr = req.body;
	// search operator ("and" or "or")
	let operator = searchAttr.operator;
	// Init collector array
	// will be a big array of arrays containing fileids that are found by the individual searches
	// will be filtered by AND or OR condition in the end (AND = File must meet all conditions; OR = at least one condition must be met)
	let fileIdCollector = [];

	let checksPerformed = [];

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
		checksPerformed.push("by Name");
	}

	// search all files that have all given Tags
	if (searchAttr.hasTags && searchAttr.hasTags.length > 0) {
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
		checksPerformed.push("by Tags");
	}

	// search by extension
	if (searchAttr.extension) {
		// search for mimeType of extension
		let lookup = mime.lookup(searchAttr.extension);
		// if known extension
		if (lookup) {
			// get all mimeType meta datas with type as value
			let metaDatas = await MetaData.findAll({
				where: { key: "mimeType", value: lookup },
			});
			// get FileIds from metaDatas (FK)
			let ids = metaDatas.map((m) => {
				return m.FileId;
			});
			// Add ids to collector
			fileIdCollector.push(ids);
		}
		checksPerformed.push("by File Extension");
	}

	// search by mimeType directly
	if (searchAttr.mimeType) {
		// get all mimeType metaDatas with type as value
		let metaDatas = await MetaData.findAll({
			where: { key: "mimeType", value: searchAttr.mimeType },
		});
		// get FileIds from metaDatas (FK)
		let ids = metaDatas.map((m) => {
			return m.FileId;
		});
		// Add ids to collector
		fileIdCollector.push(ids);
		checksPerformed.push("by mimeType");
	}

	// search by any metadata key and value
	if (searchAttr.meta) {
		if (searchAttr.meta.key && searchAttr.meta.value) {
			// get all mimeType metaDatas with type as value
			let metaDatas = await MetaData.findAll({
				where: { key: searchAttr.meta.key, value: searchAttr.meta.value },
			});
			// get FileIds from metaDatas (FK)
			let ids = metaDatas.map((m) => {
				return m.FileId;
			});
			// Add ids to collector
			fileIdCollector.push(ids);
			checksPerformed.push("by MetaData");
		}
	}

	let filesMatching = [];
	// check if any checks where applied and if not return all files

	if (checksPerformed.length > 0) {
		let fileIdsMatchingConditions = [];
		if (operator == "and") {
			// filter collector array to only allow elements in all subarrays (AND Condition)
			fileIdsMatchingConditions = _.intersection(...fileIdCollector);
		} else if (operator == "or") {
			let ids = [];
			fileIdCollector.forEach((arr) => {
				ids.push(...arr);
			});
			fileIdsMatchingConditions = _.uniq(ids);
		}

		// get list of all files that match the condition
		filesMatching = await File.findAll({
			where: { id: { [Op.in]: fileIdsMatchingConditions } },
			include: { model: Tag },
		});
	} else {
		filesMatching = await File.findAll({ include: [Tag] });
	}

	// send result
	res.send({
		files: filesMatching,
		checks: checksPerformed,
		operator: operator,
	});
});

export const searchRouter = router;
