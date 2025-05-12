
const { Sequelize } = require('sequelize');

const sequelize = new Sequelize('portfolio', 'Wayne', '', {
  host: 'localhost',
  port: '3306',
  dialect: 'mysql',
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
