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
	}
);

// File - MetaData - Relationship
File.hasMany(MetaData);
MetaData.belongsTo(File);

connection.sync({ alter: true });