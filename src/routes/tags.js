import { Router } from "express";
import { File, Tag } from "../db.js";
import { authMiddleware } from "../middlewares/auth.js";

const router = Router();

router.get("", authMiddleware, (req, res) => {
	res.send({ ok: true });
});

router.get("/list", authMiddleware, async (req, res) => {
	let files = await Tag.findAll();
	res.send(files);
});
router.get("/one/:tid", authMiddleware, async (req, res) => {
	if (req.params.tid === undefined)
		return res.status(401).send({ ok: false, error: "no tagid" });
});

router.post("/add", authMiddleware, async (req, res) => {
	const name = req.body.name;
	const color = req.body.color;

	//check if there is a tag with that name and return it
	let tagsWithName = await Tag.findAll({ where: { name: name } });
	if (tagsWithName.length != 0) return res.send(tagsWithName[0]);

	// create new Tag
	let newTag = await Tag.build({ name: name, color: color }).save();

	res.send(newTag);
});

router.delete("/delete/:tid", authMiddleware, async (req, res) => {
	if (req.params.tid === undefined)
		return res.status(401).send({ ok: false, error: "no tagid" });

	await Tag.destroy({ where: { id: req.params.tid } });
	res.send({ ok: true });
});

export const tagsRouter = router;
