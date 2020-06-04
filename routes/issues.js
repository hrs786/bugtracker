var express = require('express')
var router = express.Router()

var connection = require('../db')

router.get('/',(req,res)=>{
	let query = `SELECT id,status,priority,summary FROM issue`
	connection.query(query,(err,result,fields)=>{
		res.render('issues',{issues:result})
	})
})

module.exports = router