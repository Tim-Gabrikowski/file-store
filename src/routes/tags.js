import { Router } from "express";
import { File, Tag } from "../db.js";
import * as logger from "../logger.js";

const router = Router();

router.get("", (req, res) => {
	res.send({ ok: true });
});

router.get("/list", async (req, res) => {
	let files = await Tag.findAll();
	res.send(files);
});
router.get("/one/:tid", async (req, res) => {
	if (req.params.tid === undefined)
		return res.status(401).send({ ok: false, error: "no tagid" });
});

router.post("/add", async (req, res) => {});

router.delete("/delete/:tid", async (req, res) => {
	if (req.params.tid === undefined)
		return res.status(401).send({ ok: false, error: "no tagid" });
});

export const tagsRouter = router;
