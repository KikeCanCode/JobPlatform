import dotenv from "dotenv";
import mysql from "mysql2";
import { drizzle } from "drizzle-orm/mysql2";
import databaseConnection from '../database';

dotenv.config();

// Create connection pool
//Environment Variable  - Install the dotenv library by using npmidotenv - and create file name ENV -
const pool = mysql
  .createPool({
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
  })
  .promise();

const db = drizzle({ pool: databaseConnection });

export default db
