const mongoose = require('mongoose')
const { Sequelize } = require('sequelize')
const config = require('../configs/app')

const databases = {

  mongoDB(){
    const db = mongoose.connect(config.mongodbUri, { useNewUrlParser: true, useUnifiedTopology: true , useCreateIndex: true}, error => {
      if (error)  console.error('MongoDB error: ', error)
      console.log("MongoDB connected")
    });
    return db;
  },

  mysql(){
    const connection  = mysql.createPool({
      connectionLimit : 10,
      host            : config.hostname,
      user            : config.username,
      password        : config.password,
      database        : config.database,
      charset         : 'utf8'
    });
    return connection;
  },

  postgresql(){
    const sequelize = new Sequelize(
      config.database.name,
      config.database.username,
      config.database.password,
      {
        host: config.database.host,
        port: config.database.port,
        dialect: config.database.dialect,
        logging: false,
        pool: {
          max: 5,
          min: 0,
          acquire: 30000,
          idle: 10000
        }
      }
    );

    sequelize.authenticate()
      .then(() => {
        console.log('PostgreSQL connected successfully');
      })
      .catch(err => {
        console.error('PostgreSQL connection error:', err);
      });

    return sequelize;
  },

  mssql(){}

}

module.exports = databases.postgresql()