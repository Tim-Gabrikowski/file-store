import { Router } from "express";

const router = Router();

router.get("", (req, res) => {
	res.send({ ok: true });
});

export const filesRouter = router;
