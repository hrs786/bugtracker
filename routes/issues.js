const express = require('express')
const path = require('path')
const bodyParser = require('body-parser')
const connection = require('../db')
const secured = require('../lib/middleware/secured')

const router = express.Router()
router.use(bodyParser.urlencoded({ extended: true}))

router.get('/', secured, (req,res)=>{
	let query = `SELECT BIN_TO_UUID(id) AS id,status,priority,summary FROM issue ORDER BY open_date DESC`
	var q = connection.query(query,(err,result,fields)=>{
		//console.log(q.sql); -> query
		
		res.render('issues',{issues:result, srch: true})
	})
})

router.get('/search', secured, (req,res)=>{
	let issue_id = req.query.search
	
	let route = '/issues/' + issue_id	
	res.redirect(route)
})

router.get('/:id', secured, (req,res)=>{
	let issue_id = [req.params.id]
	let query = `SELECT BIN_TO_UUID(id) AS id,summary,opened_by,open_date,end_date,assigned_to,status,priority,project_id,description FROM issue WHERE id = UUID_TO_BIN(?)`
	var q = connection.query(query, issue_id, (err,result,fields)=>{
		//console.log(q.sql) -> query
		//console.log(result);
		

		res.render('issue-info',{issue: result})
	})
})

router.get('/:id/description', secured ,(req,res)=>{
	let options = {
		root: __dirname + '/../uploads',
		headers: {
			'Content-type': 'application/pdf'
		}
	}

	let filename = path.format({
		base: req.params.id + '.pdf'
	})
	
	res.sendFile(filename, options, (err)=>{
		if(err) throw new Error(err)		

	})

})


module.exports = router