
const { Sequelize } = require("sequelize");
const dotenv = require("dotenv");

dotenv.config();

const sequelize = new Sequelize(
  process.env.MYSQL_DB || "portfolio",   // database name
  process.env.MYSQL_USER || "Wayne",     // username
  process.env.MYSQL_PASS || "",          // password
  {
    host: process.env.MYSQL_HOST || "localhost",
    dialect: "mysql",
    port: process.env.MYSQL_PORT || 3306, // keep as number
    logging: false, // set true if you want SQL logs
  }
);

async function connectMySQL() {
  try {
    await sequelize.authenticate();
    console.log("✅ MySQL connection established");
  } catch (err) {
    console.error("❌ Error connecting to MySQL:", err.message);
  }
}

connectMySQL();

module.exports = sequelize;
