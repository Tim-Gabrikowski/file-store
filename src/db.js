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
		// Other model options go here
		sequelize: connection, // We need to pass the connection instance
		modelName: "File", // We need to choose the model name
	}
);

connection.sync({ alter: true });
