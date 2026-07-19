const { Pool } = require("pg")
 
const pool = new Pool({
  host: 'localhost',
  user: 'postgres',
  password:"1234",
  database: 'postgres',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
  maxLifetimeSeconds: 60,
})


module.exports = pool;