
import mysql from "mysql2";
import dotenv from "dotenv"; 

dotenv.config() 

// Create connection pool 
//Environment Variable  - Install the dotenv library by using npmidotenv - and create file name ENV - 
 const pool = mysql.createPool({
    host: process.env.MYSQL_HOST, 
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE
}).promise();

//Export: export default db; allows easy importing in other files
export default db;
