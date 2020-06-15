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
		let name = issue_id + '.pdf'	// add extension of file
		
		cb(null, name)
	}
})

const upload = multer({
	storage: storage,
	fileFilter: function(req, file, cb){
		if(file){
			var ext = path.extname(file.originalname)
			if(ext !== '.pdf'){
				return cb(new Error('Only PDFs are allowed')) // Handled both at front and backend
			}
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
		res.render('issues',{issues:result, srch: false})
	})
})

router.post('/:id/issues/unassigned', secured, upload.single('info'),(req,res)=>{
	const { _raw, _json, ...userProfile } = req.user;
	let person_id = (userProfile.user_id).substr(6)

	let issue_id;
	let description = false;
	if(req.file){
		description = true
		issue_id = path.parse(req.file.filename).name	// get UUID(filename) -> set issue ID
	} else{
		issue_id = uuidv4()
	}
	
	let date = new Date()
	let data = [issue_id, req.body.summary, person_id, date, (req.body.priority).toUpperCase(), Number(req.params.id), description]
	let query = `INSERT INTO issue (id, summary, opened_by, open_date, priority, project_id, description) values (UUID_TO_BIN(?), ?, ?, ?, ?, ?, ?)`
	
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
		res.render('issues',{issues: result, srch: false})
	})
})

router.get('/:id/issues/resolved', secured, (req,res)=>{
	let arr = ['RESOLVED', Number(req.params.id)]
	let query = `SELECT BIN_TO_UUID(id) AS id,status,priority,summary FROM issue WHERE status = ? AND project_id = ? ORDER BY open_date DESC`
	let q = connection.query(query, arr,(err,result,fields)=>{
		//console.log(q.sql) -> to see actual query as in db
		res.render('issues',{issues: result, srch: false})
	})
})

router.get('/:id/issues/new', secured, (req,res)=>{
	let project_id = req.params.id
	res.render('create-issue',{project_id: project_id})
})


module.exports = router