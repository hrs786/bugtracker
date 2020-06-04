var mysql = require('mysql')
var dbConfig = require('./dbconfig')

var connection = mysql.createConnection({
    host:dbConfig.host,
	user:dbConfig.user,
	password:dbConfig.password,
	database:dbConfig.database
})

connection.connect((err)=>{
    if(err)
        throw err;
})

module.exports = connection