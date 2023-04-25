import { Sequelize, Model, DataTypes } from "sequelize";
import * as logger from "./logger.js";
import dotenv from "dotenv";
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

// File - Tag - Relationship
File.belongsToMany(Tag, { through: "FileTags" });
Tag.belongsToMany(File, { through: "FileTags" });

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

connection.sync({ alter: true });
