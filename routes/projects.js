const express = require('express')
const multer = require('multer')
const path = require('path')
const { v4: uuidv4 } = require('uuid')

const connection = require('../db')
const secured = require("../lib/middleware/secured")


const router = express.Router()


const storage = multer.diskStorage({
	destination: function(req, file, cb){
		cb(null,'./uploads')	//path wrt main server file
	},
	filename: function(req, file, cb){
		let issue_id = uuidv4()	// UUID - set filename
		let name = issue_id + path.extname(file.originalname)	// add extension of file
		cb(null, name)
	}
})

const upload = multer({
	storage: storage,
	fileFilter: function(req, file, cb){
		var ext = path.extname(file.originalname)
		if(ext !== '.pdf' && ext !== '.png' && ext !== '.jpg' && ext !== '.jpeg' && ext !== '.gif'){
			return cb(new Error('Only PDF and Images are allowed'))
		}
		cb(null,true)
	}
})


router.get('/', secured, (req,res)=>{
	let query = `SELECT * FROM project ORDER BY start_date DESC`
	connection.query(query,(err,result,fields)=>{
		res.render('projects',{projects:result})
	})
})

router.get('/:id', secured, (req,res)=>{
	let project_id=req.params.id
	res.render('projects-options',{project_id:project_id});
})

router.get('/:id/issues', secured, (req,res)=>{
	let project_id = req.params.id
	res.render('projects-issues',{project_id:project_id})
})

router.get('/:id/issues/unassigned', secured, (req,res)=>{
	let arr = ['UNASSIGNED', Number(req.params.id)]
	let query = `SELECT BIN_TO_UUID(id) AS id,status,priority,summary FROM issue WHERE status = ? AND project_id = ? ORDER BY open_date DESC`
	let q = connection.query(query, arr,(err,result,fields)=>{
		//console.log(q.sql) -> to see actual query as in db
		res.render('issues',{issues:result})
	})
})

router.post('/:id/issues/unassigned', secured, upload.single('info'),(req,res)=>{
	let issue_id = path.parse(req.file.filename).name	// get UUID(filename) -> set issue ID
	
	let date = new Date()
	let data = [issue_id, req.body.summary, req.body.person_id, date, (req.body.priority).toUpperCase(), Number(req.params.id)]
	let query = `INSERT INTO issue (id, summary, opened_by, open_date, priority, project_id) values (UUID_TO_BIN(?), ?, ?, ?, ?, ?)`
	
	let q = connection.query(query, data,(err,result,fields)=>{
		//console.log(q.sql) -> to see actual query as in db
		
		if(err)
			throw err
		
		res.redirect('/projects/' + req.params.id + '/issues/unassigned')
	})
})

router.get('/:id/issues/open', secured, (req,res)=>{
	let arr = ['OPEN', Number(req.params.id)]
	let query = `SELECT BIN_TO_UUID(id) AS id,status,priority,summary FROM issue WHERE status = ? AND project_id = ? ORDER BY open_date DESC`
	let q = connection.query(query, arr,(err,result,fields)=>{
		//console.log(q.sql) -> to see actual query as in db
		res.render('issues',{issues: result})
	})
})

router.get('/:id/issues/resolved', secured, (req,res)=>{
	let arr = ['RESOLVED', Number(req.params.id)]
	let query = `SELECT BIN_TO_UUID(id) AS id,status,priority,summary FROM issue WHERE status = ? AND project_id = ? ORDER BY open_date DESC`
	let q = connection.query(query, arr,(err,result,fields)=>{
		//console.log(q.sql) -> to see actual query as in db
		res.render('issues',{issues: result})
	})
})

router.get('/:id/issues/new', secured, (req,res)=>{
	let project_id = req.params.id
	res.render('create-issue',{project_id: project_id})
})


module.exports = router