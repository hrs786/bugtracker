var express = require('express')
var router = express.Router()
var multer = require('multer')
var path = require('path')

var connection = require('../db')


var storage = multer.diskStorage({
	destination: function(req, file, cb){
		cb(null,'./uploads') //path wrt main server file
	},
	filename: function(req, file, cb){
		var name = Date.now() + '-' + file.originalname //change date by issue id
		cb(null, name)
	}
})

var upload = multer({
	storage: storage,
	fileFilter: function(req, file, cb){
		var ext = path.extname(file.originalname)
		if(ext !== '.pdf' && ext !== '.png' && ext !== '.jpg' && ext !== '.jpeg' && ext !== '.gif'){
			return cb(new Error('Only PDF and Images are allowed'))
		}
		cb(null,true)
	}
})


router.get('/',(req,res)=>{
	let query = `SELECT * FROM project ORDER BY start_date DESC`
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
	let arr = ['UNASSIGNED', Number(req.params.id)]
	let query = `SELECT id,status,priority,summary FROM issue WHERE status = ? AND project_id = ? ORDER BY open_date DESC`
	let q = connection.query(query, arr,(err,result,fields)=>{
		//console.log(q.sql) -> to see actual query as in db
		res.render('issues',{issues:result})
	})
})

router.post('/:id/issues/unassigned', upload.single('info'),(req,res)=>{
	let date = new Date()
	let data = [[req.body.summary, req.body.person_id, date, (req.body.priority).toUpperCase(), Number(req.params.id)]]
	let query = `INSERT INTO issue (summary, opened_by, open_date, priority, project_id) values ?`
	
	let q = connection.query(query,[data],(err,result,fields)=>{
		//console.log(q.sql) -> to see actual query as in db
		
		if(err)
			throw err
		
		res.redirect('/projects/' + req.params.id + '/issues/unassigned')
	})
})

router.get('/:id/issues/open',(req,res)=>{
	let arr = ['OPEN', Number(req.params.id)]
	let query = `SELECT id,status,priority,summary FROM issue WHERE status = ? AND project_id = ? ORDER BY open_date DESC`
	let q = connection.query(query, arr,(err,result,fields)=>{
		//console.log(q.sql) -> to see actual query as in db
		res.render('issues',{issues: result})
	})
})

router.get('/:id/issues/resolved',(req,res)=>{
	let arr = ['RESOLVED', Number(req.params.id)]
	let query = `SELECT id,status,priority,summary FROM issue WHERE status = ? AND project_id = ? ORDER BY open_date DESC`
	let q = connection.query(query, arr,(err,result,fields)=>{
		//console.log(q.sql) -> to see actual query as in db
		res.render('issues',{issues: result})
	})
})

router.get('/:id/issues/new',(req,res)=>{
	let project_id = req.params.id
	res.render('create-issue',{project_id: project_id})
})


module.exports = router