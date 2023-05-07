const router = require("express").Router();
const db = require("../database");
const { randomBytes, createHash } = require("crypto");
const fileUpload = require("express-fileupload");
const path = require("path");
const fs = require("fs");
const { off } = require("process");

function hash(input) {
	return createHash("sha256").update(input).digest("hex");
}

router.use(
	fileUpload({
		createParentPath: true,
	})
);

router.get("/", (req, res) => {
	db.getAllFiles().then((files) => res.send(files));
});
router.get("/:key", (req, res) => {
	const { key } = req.params;

	db.getFile({ key: key }).then((file) => {
		if (file == undefined)
			return res.status(404).send({ message: "no file", success: false });
		const filePath = `${path.join(appRoot, "../")}/files/${
			file.dataValues.filename
		}`;

		fs.readFile(filePath, (err, data) => {
			if (err) {
				console.log(err);
				return res.status(500).send("Could not download file");
			}

			res.setHeader("Content-Type", "application/octet-stream");
			res.setHeader(
				"Content-Disposition",
				'inline; filename="' + file.dataValues.originalName + '"'
			);

			res.send(data);
		});
	});
});

router.post("/upload/fe", (req, res) => uploadFile(req, res, true));
router.post("/upload", (req, res) => uploadFile(req, res, false));

async function uploadFile(req, res, frontend) {
	try {
		if (!req.files) {
			res.send({
				status: false,
				message: "No file uploaded",
			});
		} else {
			//Use the name of the input field (i.e. "avatar") to retrieve the uploaded file
			let uploadFile = req.files.file;

			var originalName = uploadFile.name;
			var newName = hash(uploadFile.data);
			//Use the mv() method to place the file in upload directory (i.e. "uploads")
			uploadFile.mv("./files/" + newName);

			if (!frontend) {
				insertFileToDb({ originalName: originalName, filename: newName }, res);
			} else {
				insertFileToDb(
					{ originalName: originalName, filename: newName },
					{
						send: (newFile) => {
							fs.readFile(
								path.join(__dirname, "../frontend/uploadDone.html"),
								(err, data) => {
									if (err) return console.log(err);
									var back = data.toString();
									back = back.replace(/--KEY--/g, newFile.dataValues.key);
									res.send(back);
								}
							);
						},
					}
				);
			}
		}
	} catch (err) {
		res.status(500).send(err);
	}
}

function insertFileToDb(file, res) {
	var key = randomBytes(3).toString("hex");
	db.addFile({
		originalName: file.originalName,
		filename: file.filename,
		key: key,
	})
		.then((newFile) => {
			res.send(newFile);
		})
		.catch((error) => {
			if (error.name == "SequelizeUniqueConstraintError") {
				insertFileToDb(file, res);
			}
		});
}

module.exports = router;
