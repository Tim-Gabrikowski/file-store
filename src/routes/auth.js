import { Router } from "express";
import { Token } from "../db.js";
import * as uuid from "uuid";
import { randomBytes } from "crypto";

import dotenv from "dotenv";
dotenv.config();

const router = Router();

router.post("/add-token", validateAdminToken, async (req, res) => {
	const { name, type } = req.body;
	if (name == undefined) return res.status(400).send();

	let token = await Token.build({
		type: type || "default",
		token: randomBytes(32).toString("hex"),
		name: name,
		uuid: uuid.v5(name, uuid.v1()),
	}).save();

	res.send(token);
});

router.get("/list-tokens", validateAdminToken, async (req, res) => {
	let tokens = await Token.findAll({
		attributes: ["id", "type", "name", "uuid"],
	});
	res.send(tokens);
});
router.delete("/delete-token/:id", validateAdminToken, async (req, res) => {
	const tokenId = req.params.id;
	if (tokenId == null || tokenId == undefined) return res.status(400).send();

	await Token.destroy({ where: { id: tokenId } }).catch((err) =>
		res.status(500).send(err)
	);

	res.send({ ok: true });
});

export const authRouter = router;

function validateAdminToken(req, res, next) {
	const authHeader = req.headers["authorization"];
	const token = authHeader && authHeader.split(" ")[1];
	if (token == null) {
		return res.status(401).send({ token: false, valid: false });
	}
	if (token === process.env.ADMIN_TOKEN) {
		next();
	} else {
		return res.status(401).send({ token: true, valid: false });
	}
}
