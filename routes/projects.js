const express = require('express')
const multer = require('multer')
const path = require('path')
const bodyParser = require('body-parser')
const methodOverride = require('method-override')
const { v4: uuidv4 } = require('uuid')

const connection = require('../db')
const secured = require("../lib/middleware/secured")
const Admin = require('../lib/middleware/Admin')


const router = express.Router()
router.use(bodyParser.urlencoded({extended: true}))
router.use(methodOverride('_method'))

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
	let query = `SELECT name,project.id AS projectId,username,summary,status FROM project INNER JOIN people_info ON project.head_id=people_info.id ORDER BY start_date DESC`
	
	connection.query(query,(err,result,fields)=>{	
		if(err){
			throw err
		}	
		
		res.render('projects',{projects:result})
	})
})

router.post('/', secured, Admin, (req,res)=>{
	let projectName = req.body.projectName
	let summary = req.body.summary
	let headUsr = req.body.headUsr // check if not in db
	let expDate = req.body.expDate
	let date = new Date()

	let headId;
	let q = `SELECT id FROM people_info WHERE username= ?`
	connection.query(q, [headUsr], (err,result,fields)=>{
		if(err){
			throw err
		}

		headId = result[0].id

		let arr = [projectName, headId, date, expDate, summary]
		let query = `INSERT INTO project(name,head_id,start_date,exp_end_date,summary) values( ?, ?, ?, ?, ?)`
		connection.query(query, arr,(err, result, fields)=>{
			if(err){
				throw err
			}

			res.redirect('/projects')
		})
		
	})
	
})

router.get('/new', secured, Admin, (req,res)=>{
	let query = `SELECT username FROM people_info`
	connection.query(query, (err, result, fields)=>{
		if(err){
			throw err
		}
		
		res.render('create-project',{ users: result})
	})
})

router.get('/:id', secured, (req,res)=>{
	let project_id=req.params.id
	res.render('projects-options',{project_id:project_id});
})

router.put('/:id', secured, Admin, (req,res)=>{	
	let status_map = {
		"NEW": 1,
		"OPEN": 2,
		"INPROGRESS": 3,
		"COMPLETED": 4,
		"ONHOLD": 5
	}
	let status = req.body.status	
	status = status_map[status]
	

	let date = null
	if(req.body.endDate !== ''){
		date = req.body.endDate
	}

	let arr = [req.body.projectName, req.body.headUsr, req.body.summary, status, date, req.params.id]

	let query1 = `SELECT id FROM people_info WHERE username=?`
	let query2 = `UPDATE project SET name=?, head_id=?, summary=?, status=?, end_date=? WHERE id=?`
	connection.query(query1, [arr[1]], (err1,result1,fields1)=>{
		if(err1){
			throw err1
		}
		arr[1] = result1[0].id

		connection.query(query2, arr, (err2,result2,fields2)=>{
			if(err2){
				throw err2
			}

			res.redirect('/projects/' + req.params.id + '/edit') //change
		})
	})
})

router.get('/:id/edit', secured, Admin, (req,res)=>{

	let query = `SELECT * FROM project WHERE id=?`
	let query2 = `SELECT username FROM people_info`
	let query3 =`SELECT username FROM people_info WHERE id=?`
	connection.query(query, [req.params.id], (err1,result1,fields1)=>{
		if(err1){
			throw err1
		}

		let head_id = result1[0].head_id
		connection.query(query2, (err2,result2,fields2)=>{
			if(err2){
				throw err2
			}
			
			connection.query(query3, [head_id], (err3,result3,fields3)=>{
				if(err3){
					throw err3
				}

				// get date in yyyy-mm-dd for pug(html)
				let end_date = result1[0].end_date
				let dd = end_date.getDate()
				let mm = end_date.getMonth() + 1
				let yyyy = end_date.getFullYear()
				if (dd < 10) { 
					dd = '0' + dd; 
				} 
				if (mm < 10) { 
					mm = '0' + mm; 
				}
				end_date = yyyy.toString() + '-' + mm.toString() + '-' + dd.toString()				
				
				
				res.render('edit-project',{ detail: result1[0], users: result2, headUsername: result3[0].username, project_id: req.params.id, end_date: end_date})
			})
		})
	})
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