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

// MAPS
var project_status = {
	1: 'NEW',
	2: 'OPEN',
	3: 'IN PROGRESS',
	4: 'COMPLETED',
	5: 'ON HOLD'
}

var issue_status = {
	1: 'UNASSIGNED',
	2: 'OPEN',
	3: 'RESOLVED'
}

var issue_priority = {
	1: 'MINOR',
	2: 'NORMAL',
	3: 'MAJOR',
	4: 'CRITICAL'
}

// Projects
router.get('/', secured, (req,res)=>{
	let status_map = {
		1: "NEW",
		2: "OPEN",
		3: "IN PROGRESS",
		4: "COMPLETED",
		5: "ON HOLD"
	}
	let query = `SELECT name,project.id AS projectId,username,summary,status FROM project INNER JOIN people_info ON project.head_id=people_info.id ORDER BY start_date DESC`
	
	connection.query(query,(err,result,fields)=>{	
		if(err){
			req.flash("error", "Server error")
			res.redirect("/dashboard")
		} else{
			let project_status
			if(result.length>0){
				project_status = status_map[result[0].status]
			}
			res.render('projects',{projects:result, project_status: project_status})
		}
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
	connection.query(q, [headUsr], (err1,result,fields)=>{
		if(err1 || result.length===0){
			req.flash("error", "No such Head User exist")
			res.redirect("/projects")
		} else{			
			headId = result[0].id

			let arr = [projectName, headId, date, expDate, summary]
			let query = `INSERT INTO project(name,head_id,start_date,exp_end_date,summary) values( ?, ?, ?, ?, ?)`
			connection.query(query, arr,(err2, result, fields)=>{
				if(err2){
					req.flash("error", "Project couldn't be created, please try again")
					res.redirect("/projects")
				} else{
					req.flash("success", "Project created successfuly")
					res.redirect('/projects')
				}
			})
		}
		
	})
	
})

router.get('/new', secured, Admin, (req,res)=>{
	let query = `SELECT username FROM people_info`
	connection.query(query, (err, result, fields)=>{
		if(err){
			req.flash("error", "Server error")
			res.redirect("/projects")
		} else{
			res.render('create-project',{ users: result})
		}		
	})
})


// Project
router.get('/:id', secured,(req,res)=>{		
	let project_id=req.params.id
	let query = `SELECT * FROM project WHERE id= ?`

	connection.query(query, [project_id], (err,result,fields)=>{
		if( err || result.length===0 ){
			req.flash("error", "No such project exist")
			res.redirect("/projects")
		} else{			
			let project_name = result[0].name	
			res.render('projects-options',{project_id:project_id, project_name: project_name});
		}
	})
})

router.put('/:id', secured, Admin, (req,res)=>{	
	let project_id = req.params.id
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
		if( err1 || result1.length===0 ){
			req.flash("error", "No such Head User exist")
			res.redirect("/projects/" + project_id)
		}
		else{
			arr[1] = result1[0].id

			connection.query(query2, arr, (err2,result2,fields2)=>{
				if(err2){
					req.flash("error", "Project couldn't be updated")
					res.redirect("/projects")
				} else{
					req.flash("success", "Project updated successfuly")
					res.redirect('/projects/' + req.params.id) // redirect to description page
				}
			})
		}
	})
})

router.delete('/:id', secured, Admin, (req,res)=>{	
	let project_id = req.params.id

	let query1 = `DELETE FROM issue WHERE project_id= ?`
	let query2 = `DELETE FROM work WHERE project_id= ?`;
	let query3 = `DELETE FROM project WHERE id= ?`
	connection.query(query1, [project_id], (err1,result1,fields1)=>{
		if(err1){
			req.flash("error", "Project couldn't be deleted, try again")
			res.redirect("/projects")
		} else{
			connection.query(query2, [project_id], (err2,result2,fields2)=>{
				if(err2){
					req.flash("error", "All project data couldn't be deleted, try again")
					res.redirect("/projects")
				} else{
					connection.query(query3, [project_id], (err3,result3,field3)=>{
						if(err3){
							req.flash("error", "All project data couldn't be deleted, try again")
							res.redirect("/projects")
						} else{
							req.flash("success", "Project deleted successfuly")
							res.redirect("/projects")
						}
					})
				}
			})
		}
	})

})

router.get('/:id/edit', secured, Admin, (req,res)=>{
	let project_id = req.params.id

	let query = `SELECT * FROM project WHERE id=?`
	let query2 = `SELECT username FROM people_info`
	let query3 =`SELECT username FROM people_info WHERE id=?`
	connection.query(query, [req.params.id], (err1,result1,fields1)=>{
		if( err1 || result1.length===0 ){
			req.flash("error", "No such project exist")
			res.redirect("/projects")
		} else{
			let head_id = result1[0].head_id
			connection.query(query2, (err2,result2,fields2)=>{
				if(err2){
					req.flash("error", "Server error")
					res.redirect("/projects/" + project_id)
				} else{
					connection.query(query3, [head_id], (err3,result3,fields3)=>{
						if( err3 || result3.length===0 ){
							req.flash("error", "Server error")
							res.redirect("/projects/" + project_id)
						} else{
							// get date in yyyy-mm-dd for pug(html)
							let end_date = result1[0].end_date
							if(end_date){
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
							}		
							
							res.render('edit-project',{ detail: result1[0], users: result2, headUsername: result3[0].username, project_id: req.params.id, end_date: end_date})
						}
					})
				}
			})
		}
	})
})

router.get('/:id/description', secured, (req,res)=>{
	let project_id = req.params.id

	let query = `SELECT * FROM project WHERE id= ?`
	let query1 = `SELECT username FROM people_info WHERE id= ?`
	connection.query(query, [project_id], (err,result,fields)=>{
		if(err || result.length === 0){
			req.flash("error", "No such project")
			res.redirect("/projects")
		} else{
			result[0].status = project_status[result[0].status]
			let head_id = result[0].head_id
			connection.query(query1, [head_id], (err1,result1,fields1)=>{
				if(err1){
					req.flash("error", "Server error")
					res.redirect("/projects/" + project_id)
				} else{
					let head = result1[0].username
					res.render('project-info', {project: result[0], head: head})
				}
			})
		}
	})
})

router.get('/:id/issues', secured, (req,res)=>{
	let project_id=req.params.id
	let query = `SELECT name FROM project WHERE id= ?`

	connection.query(query, [project_id], (err,result,fields)=>{
		if( err || result.length===0 ){
			req.flash("error", "No such project exist")
			res.redirect("/projects")
		} else{
			let project_name = result[0].name
			res.render('projects-issues',{project_id:project_id, project_name: project_name});
		}
	})
})

router.get('/:id/issues/unassigned', secured, (req,res)=>{
	let project_id = req.params.id
	let arr = [1, Number(project_id)]
	let query1 = `SELECT name FROM project WHERE id= ?`
	let query2 = `SELECT BIN_TO_UUID(id) AS id,status,priority,summary FROM issue WHERE status = ? AND project_id = ? ORDER BY open_date DESC`
	
	connection.query(query1, [project_id],(err1,result1,fields1)=>{
		if( err1 || result1.length===0 ){
			req.flash("error", "No such project exist")
			res.redirect("/projects/" + project_id)
		} else{
			let project_name = result1[0].name
			connection.query(query2, arr, (err2,results2,fields2)=>{
				if(err2){
					req.flash("error", "Server error")
					res.redirect("/projects/" + project_id + "/issues")
				} else{
					results2.forEach((result)=>{
						result.status = issue_status[result.status]
						result.priority = issue_priority[result.priority]
					})
	
					res.render('issues',{issues:results2, srch: false, project_name: project_name, project_id: project_id})
				}
			})
		}
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
	let data = [issue_id, req.body.summary, person_id, date, Number(req.body.priority), Number(req.params.id), description]
	let query = `INSERT INTO issue (id, summary, opened_by, open_date, priority, project_id, description) values (UUID_TO_BIN(?), ?, ?, ?, ?, ?, ?)`
	
	connection.query(query, data,(err,result,fields)=>{		
		if(err){
			req.flash("error", "Issue couldn't be created")
			res.redirect("/projects/" + project_id + "/issues")
		} else{
			req.flash("success", "Issue created successfuly")
			res.redirect('/projects/' + req.params.id + '/issues/unassigned')
		}
	})
})

router.get('/:id/issues/open', secured, (req,res)=>{
	let project_id = req.params.id
	let arr = [2, Number(project_id)]
	let query1 = `SELECT name FROM project WHERE id= ?`
	let query2 = `SELECT BIN_TO_UUID(id) AS id,status,priority,summary FROM issue WHERE status = ? AND project_id = ? ORDER BY open_date DESC`

	connection.query(query1, [project_id],(err1,result1,fields1)=>{
		if( err1 || result1.length===0 ){
			req.flash("error", "No such project exist")
			res.redirect("/projects")
		} else{
			let project_name = result1[0].name
			connection.query(query2, arr, (err2,results2,fields2)=>{
				if(err2){
					req.flash("error", "Server error")
					res.redirect("/projects/" + project_id + "/issues")
				} else{
					results2.forEach((result)=>{
						result.status = issue_status[result.status]
						result.priority = issue_priority[result.priority]
					})
	
					res.render('issues',{issues:results2, srch: false, project_name: project_name, project_id: project_id})
				}
			})
		}
	})
})

router.get('/:id/issues/resolved', secured, (req,res)=>{
	let project_id = req.params.id
	let arr = [3, Number(req.params.id)]
	let query1 = `SELECT name FROM project WHERE id= ?`
	let query2 = `SELECT BIN_TO_UUID(id) AS id,status,priority,summary FROM issue WHERE status = ? AND project_id = ? ORDER BY open_date DESC`
	
	connection.query(query1, [project_id],(err1,result1,fields1)=>{
		if( err1 || result1.length===0 ){
			req.flash("error", "No such project exist")
			res.redirect("/projects")
		} else{
			let project_name = result1[0].name
			connection.query(query2, arr, (err2,results2,fields2)=>{
				if(err2){
					req.flash("error", "Server error")
					res.redirect("/projects/" + project_id + "/issues")
				} else{
					results2.forEach((result)=>{
						result.status = issue_status[result.status]
						result.priority = issue_priority[result.priority]
					})
					res.render('issues',{issues:results2, srch: false, project_name: project_name, project_id: project_id})
				}
			})
		}
	})
})

router.get('/:id/issues/new', secured, (req,res)=>{
	let project_id = req.params.id
	let query = `SELECT name FROM project WHERE id= ?`

	connection.query(query, [project_id], (err,result,fields)=>{
		if( err || result.length===0 ){
			req.flash("error", "No such project exist")
			res.redirect("/projects")
		} else{
			let project_name = result[0].name
			res.render('create-issue',{project_id:project_id, project_name: project_name});
		}
	})
})


// Project members
router.get('/:id/members', secured, (req,res)=>{
	let project_id = req.params.id
	let query1 = `SELECT name FROM project WHERE id= ?`
	let query2 = `SELECT username FROM ((SELECT * FROM work WHERE project_id= ?) AS T1 INNER JOIN people_info ON T1.person_id=people_info.id)`

	connection.query(query1, [project_id], (err1,result1,fields1)=>{	
		if( err1 || result1.length===0 ){
			req.flash("error", "No such project exist")
			res.redirect("/projects")
		} else{
			let project_name = result1[0].name
			connection.query(query2, [project_id], (err2,result2,fields2)=>{
				if(err2){
					req.flash("error", "Members couldn't be found, try again later")
					res.redirect("/projects/" + project_id)
				} else{
					res.render('members',{members: result2, project_id: project_id, project_name: project_name})
				}
			})
		}
	})
})

router.get('/:id/members/edit', secured, Admin, (req,res)=>{
	let project_id = req.params.id
	let query1 = `SELECT name FROM project WHERE id= ?`
	let query2 = `SELECT username FROM people_info`

	connection.query(query1, [project_id],(err1,result1,fields1)=>{
		if( err1 || result1.length===0 ){
			req.flash("error", "No such project exist")
			res.redirect("/projects")
		} else{
			let project_name = result1[0].name
			connection.query(query2, (err2,result2,fields2)=>{
				if(err2){
					req.flash("error", "Server error")
					res.redirect("/projects/" + project_id + "/members")
				} else{
					res.render('add-member',{users: result2, project_id: project_id, project_name: project_name})
				}
			})
		}
	})
})

router.post('/:id/members', secured, Admin, (req,res)=>{
	let project_id = req.params.id
	
	let username = req.body.usr
	let query1 = `SELECT id FROM people_info WHERE username= ?`
	let query2 = `INSERT INTO work(person_id,project_id) values(?, ?)`

	connection.query(query1, [username], (err1,result1,fields1)=>{
		if( err1 || result1.length===0 ){
			req.flash("error", "No such user exist")
			res.redirect("/projects/" + project_id)
		} else{
			let member_id = result1[0].id
		
			connection.query(query2, [member_id, Number(project_id)], (err2,result2,fields2)=>{
				if(err2){
					let errMessage = "Member couldn't be added"
					if(err2.sqlState === '23000'){
						errMessage = "Member exist already"
					}
					
					req.flash("error", errMessage)
					res.redirect("/projects/" + project_id + "/members")
				} else{
					// handle duplicate insertion error
					let mem = '/projects/' + project_id + '/members'		
					
					req.flash("success", "Member added successfuly")
					res.redirect(mem)
				}
			})
		}
	})
})

router.delete('/:id/members', secured, Admin, (req,res)=>{
	let project_id = req.params.id
	
	let username = req.body.usr
	let query1 = `SELECT id FROM people_info WHERE username= ?`
	let query2 = `DELETE FROM work WHERE person_id= ? AND project_id= ?`

	connection.query(query1, [username], (err1,result1,fields1)=>{
		if( err1 || result1.length===0 ){
			req.flash("error", "No such user exist")
			res.redirect("/projects/" + project_id + "/members")
		} else{
			let member_id = result1[0].id
		
			connection.query(query2, [member_id, Number(project_id)], (err2,result2,fields2)=>{
				if(err2){
					let errMessage = "Member couldn't be deleted"
					if(err2.sqlState === '45000'){
						errMessage = err2.sqlMessage
					}
					req.flash("error", errMessage)
					res.redirect("/projects/" + project_id + "/members")
				} else{
					// handle no entry error
					let mem = '/projects/' + project_id + '/members'
					
					let successMessage = "Member deleted successfuly"
					if(result2.affectedRows === 0){
						successMessage = "No such member exist"
					}
					req.flash("success", successMessage)
					res.redirect(mem)
				}
			})
		}
	})
})


router.get('/:id/progress', secured, (req,res)=>{
	let project_id = req.params.id

	let query = `SELECT name FROM project WHERE id= ?`
	let query1 = `SELECT priority, COUNT(*) AS COUNT FROM issue WHERE project_id= ? GROUP BY priority`
	let query2 = `SELECT status, COUNT(*) AS COUNT FROM issue WHERE project_id= ? AND status<>3 GROUP BY status`

	connection.query(query, [project_id], (err,results,fields)=>{
		if( err || results.length===0 ){
			req.flash("error", "No such project exist")
			res.redirect("/projects")
		} else{
			let project_name = results[0].name

			connection.query(query1, [project_id], (err1,results1,fields1)=>{
				if(err1){
					req.flash("error", "Server error")
					res.redirect("/projects/" + project_id)
				} else{
					let priority_arr = [0, 0, 0, 0]
					results1.forEach(result=>{
						let val_prior = result.priority
						let val = result.COUNT
						priority_arr[val_prior-1] = val
					})
		
					connection.query(query2, [project_id], (err2,results2,fields2)=>{
						if(err2){
							req.flash("error", "Server error")
							res.redirect("/projects/" + project_id)
						} else{
							let status_arr = [0, 0, 0]
							results2.forEach(result=>{
								let val_status = result.status
								let val = result.COUNT
								status_arr[val_status-1] = val
							})	
							
		
							res.render('progress',{ project_name:project_name, project_id: project_id, priority_arr: priority_arr, status_arr: status_arr, foo: true})
						}
					})
				}
			})
		}
	})
})


module.exports = router

// post, put with invalid id ??