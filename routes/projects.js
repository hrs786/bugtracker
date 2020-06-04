var express = require('express')
var router = express.Router()

var connection = require('../db')

router.get('/',(req,res)=>{
	let query = `SELECT * FROM project`
	connection.query(query,(err,result,fields)=>{
		res.render('projects',{projects:result})
	})
})

router.get('/:id',(req,res)=>{
	let project_id=req.params.id
	res.render('projects-options',{project_id:project_id});
})

router.get('/:id/issues',(req,res)=>{
	let project_id = req.params.id
	res.render('projects-issues',{project_id:project_id})
})

router.get('/:id/issues/unassigned',(req,res)=>{
	res.send('wait.....')
})

router.post('/:id/issues/unassigned',(req,res)=>{
	console.log(req.body)
	res.send('hiii')
	// let date = new Date().toJSON().slice(0, 10)
	// console.log(date)
	// let data = [req.body.summary, req.body.person_id, date, req.body.priority, req.params.id]
	// let query = `INSERT INTO issue (summary, opened_by, open_date, priority, project_id) values ?`
	// connection.query(query,[data],(err,result,fields)=>{
	// 	if(err)
	// 		throw err
		
	// 	res.redirect('/projects/:id/issues/unassigned')
	// })
})

router.get('/:id/issues/open',(req,res)=>{
	res.send('wait.....')
})

router.get('/:id/issues/resolved',(req,res)=>{
	res.send('wait.....')
})

router.get('/:id/issues/new',(req,res)=>{
	let project_id = req.params.id
	res.render('create-issue',{project_id:project_id})
})


module.exports = router