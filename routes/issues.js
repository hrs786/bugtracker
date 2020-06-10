const express = require('express')
const connection = require('../db')
const secured = require('../lib/middleware/secured')

const router = express.Router()


router.get('/', secured, (req,res)=>{
	let query = `SELECT BIN_TO_UUID(id) AS id,status,priority,summary FROM issue ORDER BY open_date DESC`
	var q = connection.query(query,(err,result,fields)=>{
		//console.log(q.sql); -> query
		//console.log(result);
		
		res.render('issues',{issues:result})
	})
})

router.get('/:id', secured, (req,res)=>{
	let issue_id = [req.params.id]
	let query = `SELECT BIN_TO_UUID(id) AS id,summary,opened_by,open_date,end_date,assigned_to,status,priority,project_id FROM issue WHERE id = UUID_TO_BIN(?)`
	var q = connection.query(query, issue_id, (err,result,fields)=>{
		//console.log(q.sql) -> query
		//console.log(result);
		

		res.render('issue-info',{issue: result})
	})
})

module.exports = router