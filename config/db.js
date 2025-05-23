
const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASS, {
  host: process.env.DB_HOST,
  dialect: 'mysql',
  port: process.env.DB_PORT,
  logging: false,
});

sequelize.authenticate()
  .then(() => {
    console.log('Database connection established');
  })
  .catch((err) => {
    console.error('Error connecting to the database:', err);
  });

module.exports = sequelize;
