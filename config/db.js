
const { Sequelize } = require('sequelize');

const sequelize = new Sequelize('portfolio', 'Wayne', '', {
  host: '127.0.0.1',
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
