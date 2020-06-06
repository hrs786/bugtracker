var express = require('express')
var router = express.Router()

var connection = require('../db')

router.get('/',(req,res)=>{
	let query = `SELECT id,status,priority,summary FROM issue ORDER BY open_date DESC`
	connection.query(query,(err,result,fields)=>{
		res.render('issues',{issues:result})
	})
})

router.get('/:id',(req,res)=>{
	let issue_id = [req.params.id]
	let query = `SELECT * FROM issue WHERE id = ?`
	connection.query(query, issue_id, (err,result,fields)=>{
		console.log(result)
		
		res.render('issue-info',{issue: result})
	})
})

module.exports = router