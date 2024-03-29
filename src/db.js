import { Sequelize, Model, DataTypes, Op } from "sequelize";
import * as logger from "./logger.js";
import dotenv from "dotenv";
import { randomBytes } from "crypto";
dotenv.config();

const connection = new Sequelize(
	process.env.DATABASE_NAME,
	process.env.DATABASE_USERNAME,
	process.env.DATABASE_PASSWORD,
	{
		port: process.env.DATABASE_PORT,
		host: process.env.DATABASE_HOST,
		logging: dbLogger(),
		dialect: "mysql",
		pool: {
			max: 5,
			min: 0,
			acquire: 30000,
			idle: 10000,
		},
	}
);

function dbLogger() {
	return (message) => {
		logger.debug("DATABASE", message);
	};
}

export class File extends Model {}

File.init(
	{
		id: {
			type: DataTypes.INTEGER,
			autoIncrement: true,
			primaryKey: true,
		},
		key: {
			type: DataTypes.STRING,
			allowNull: false,
			unique: "fileKey_Unique",
		},
		name: {
			type: DataTypes.STRING,
			allowNull: false,
		},
		path: {
			type: DataTypes.STRING,
			allowNull: false,
		},
		hash: {
			type: DataTypes.STRING,
			allowNull: false,
		},
		size: {
			type: DataTypes.BIGINT,
			allowNull: true,
		},
		owner: {
			type: DataTypes.STRING,
			allowNull: false,
			defaultValue: "internal",
		},
		downloaded: {
			type: DataTypes.INTEGER,
			allowNull: false,
			defaultValue: 0,
		},
		streamed: {
			type: DataTypes.INTEGER,
			allowNull: false,
			defaultValue: 0,
		},
	},
	{
		sequelize: connection,
		modelName: "File",
		hooks: {
			beforeCreate: (record, options) => {
				record.dataValues.createdAt = Date.now();
				record.dataValues.updatedAt = Date.now();
			},
			beforeUpdate: (record, options) => {
				record.dataValues.updatedAt = Date.now();
			},
			afterFind: (records, options) => {
				if (records === undefined || records === null) return;

				if (records instanceof Array) {
					records.forEach((record) => {
						record.dataValues.updatedAt = new Date(
							record.dataValues.updatedAt
						).getTime();
						record.dataValues.createdAt = new Date(
							record.dataValues.updatedAt
						).getTime();

						if (record.dataValues.MetaData) {
							record.dataValues.MetaData.forEach((md) => {
								md.dataValues.createdAt = new Date(
									md.dataValues.createdAt
								).getTime();
								md.dataValues.updatedAt = new Date(
									md.dataValues.updatedAt
								).getTime();
							});
						}
					});
				} else {
					records.dataValues.updatedAt = new Date(
						records.dataValues.updatedAt
					).getTime();
					records.dataValues.createdAt = new Date(
						records.dataValues.updatedAt
					).getTime();

					if (records.dataValues.MetaData) {
						records.dataValues.MetaData.forEach((md) => {
							md.dataValues.createdAt = new Date(
								md.dataValues.createdAt
							).getTime();
							md.dataValues.updatedAt = new Date(
								md.dataValues.updatedAt
							).getTime();
						});
					}
				}
			},
		},
	}
);

export class Tag extends Model {}

Tag.init(
	{
		id: {
			type: DataTypes.INTEGER,
			autoIncrement: true,
			primaryKey: true,
		},
		name: {
			type: DataTypes.STRING,
			allowNull: false,
		},
		color: {
			type: DataTypes.STRING,
			allowNull: true,
			defaultValue: "#ffffff",
		},
	},
	{
		sequelize: connection,
		modelName: "Tags",
		timestamps: false,
	}
);

class FileTags extends Model {}

FileTags.init(
	{},
	{
		modelName: "FileTags",
		sequelize: connection,
		timestamps: false,
	}
);

// File - Tag - Relationship
File.belongsToMany(Tag, { through: FileTags });
Tag.belongsToMany(File, { through: FileTags });

export class MetaData extends Model {}

MetaData.init(
	{
		id: {
			type: DataTypes.INTEGER,
			autoIncrement: true,
			primaryKey: true,
		},
		key: {
			type: DataTypes.STRING,
			allowNull: false,
		},
		value: {
			type: DataTypes.STRING,
			allowNull: false,
		},
	},
	{
		sequelize: connection,
		tableName: "MetaData",
		hooks: {
			beforeCreate: (record, options) => {
				record.dataValues.createdAt = Date.now();
				record.dataValues.updatedAt = Date.now();
			},
			beforeUpdate: (record, options) => {
				record.dataValues.updatedAt = Date.now();
			},
			afterFind: (records, options) => {
				if (records === undefined || records === null) return;

				if (records instanceof Array) {
					records.forEach((record) => {
						record.dataValues.updatedAt = new Date(
							record.dataValues.updatedAt
						).getTime();
						record.dataValues.createdAt = new Date(
							record.dataValues.updatedAt
						).getTime();
					});
				} else {
					records.dataValues.updatedAt = new Date(
						records.dataValues.updatedAt
					).getTime();
					records.dataValues.createdAt = new Date(
						records.dataValues.updatedAt
					).getTime();
				}
			},
		},
	}
);

// File - MetaData - Relationship
File.hasMany(MetaData);
MetaData.belongsTo(File);

export class Token extends Model {}

Token.init(
	{
		id: {
			type: DataTypes.INTEGER,
			autoIncrement: true,
			primaryKey: true,
		},
		type: {
			type: DataTypes.STRING,
		},
		token: {
			type: DataTypes.STRING,
		},
		name: {
			type: DataTypes.STRING,
		},
		uuid: {
			type: DataTypes.STRING,
		},
	},
	{ sequelize: connection, timestamps: false, tableName: "Tokens" }
);

logger.info("DATABASE", "Syncing DB");

await connection.sync({ alter: true });

logger.info("DATABASE", "SYNC DONE");

logger.info("DATABASE", "Checking all files for Keys");

let filesWoKey = await File.findAll({
	where: {
		key: {
			[Op.is]: null,
		},
	},
});

logger.info("DATABASE", filesWoKey.length + " Files without keys");

for (let f = 0; f < filesWoKey.length; f++) {
	const file = filesWoKey[f];
	file.key = randomBytes(12).toString("base64url");
	await file.save();
	logger.info(
		"DATABASE",
		"File " + file.dataValues.id + " has now the Key: " + file.dataValues.key
	);
}
