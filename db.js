const mysql = require('mysql')
const dotenv = require('dotenv')

dotenv.config()

var connection = mysql.createConnection({
    host:process.env.DB_HOST,
	user:process.env.DB_USER,
	password:process.env.DB_PASS,
	database:process.env.DB_NAME
})

connection.connect((err)=>{
    if(err)
        throw err;
})

module.exports = connection