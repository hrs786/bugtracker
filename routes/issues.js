const express = require('express')
const path = require('path')
const bodyParser = require('body-parser')
const connection = require('../db')
const secured = require('../lib/middleware/secured')
const Head = require('../lib/middleware/Head')
const chkHead = require('../lib/middleware/isHead')
const Assigned = require('../lib/middleware/Assigned')
const chkAssigned = require('../lib/middleware/isAssigned')
const methodOverride = require('method-override')


const router = express.Router()
router.use(bodyParser.urlencoded({ extended: true}))
router.use(methodOverride('_method'))

// MAPS
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

router.get('/', secured, (req,res)=>{
	let query = `SELECT BIN_TO_UUID(id) AS id,status,priority,summary FROM issue ORDER BY open_date DESC`
	connection.query(query,(err,results,fields)=>{
		if(err){
			req.flash("error", "Server error")
			res.redirect("/dashboard")
		} else{
			results.forEach((result)=>{
				result.status = issue_status[result.status]
				result.priority = issue_priority[result.priority]
			})
			
			
			res.render('issues',{issues:results, srch: true, notShow: true})
		}
	})
})

router.get('/search', secured, (req,res)=>{
	let issue_id = req.query.search
	
	let route = '/issues/' + issue_id	
	res.redirect(route)
})

router.get('/:id', secured, chkHead, chkAssigned,(req,res)=>{	
	let issue_id = [req.params.id]
	let query1 = `SELECT BIN_TO_UUID(id) AS id,summary,opened_by,open_date,end_date,assigned_to,status,priority,project_id,description FROM issue WHERE id = UUID_TO_BIN(?)`
	let query2 = `SELECT username from people_info WHERE id= ?`
	connection.query(query1, issue_id, (err1,results1,fields1)=>{
		if( err1 || results1.length===0 ){
			req.flash("error", "Issue not found")
			res.redirect("/issues")
		} else{
			results1.forEach((result)=>{
				result.status = issue_status[result.status]
				result.priority = issue_priority[result.priority]
			})
			let open_user = results1[0].opened_by
			let assigned_user = results1[0].assigned_to
			
			connection.query(query2, [open_user], (err2,result2,fields2)=>{
				if(err2){
					req.flash("error", "Server error")
					res.redirect("/issues")
				} else{
					open_user = result2[0].username
					connection.query(query2, [assigned_user], (err3,result3,fields3)=>{
						if(err3){
							req.flash("error", "Server error")
							res.redirect("/issues")
						} else{
							if(assigned_user){
								assigned_user = result3[0].username
							} else{
								assigned_user = '[NOT ASSIGNED]'
							}
			
							res.render('issue-info',{issue: results1, open_user: open_user, assigned_user: assigned_user})
						}
					})
				}
			})
		}
	})
})

router.put('/:id', secured, Assigned, chkHead, (req,res)=>{
	let issue_id = req.params.id

	let query = `SELECT id FROM people_info WHERE username= ?`
	connection.query(query, [res.locals.userIs], (err,result,fields)=>{
		if(err){
			req.flash("error","Server error")
			res.redirect('/issues/' + issue_id)
		} else{
			let person_id = result[0].id;

			connection.query(`SELECT * FROM issue WHERE id= UUID_TO_BIN(?)`, [issue_id], (err3,result3,fields3)=>{
				if(err3 || result3.length === 0){
					req.flash("error","No such issue")
					res.redirect("/issues")
				} else{
					if(res.locals.isAdmin || res.locals.isHead){
						let username = req.body.usr
	
						let query1 = `SELECT id FROM people_info WHERE username= ?`
						let query2 = `UPDATE issue SET summary= ?, priority= ?, status= ?, assigned_to= ? WHERE id= UUID_TO_BIN(?)`
							
						connection.query(query1, [username], (err1,result1,fields1)=>{
							if( err1 || ( username.length!==0 && result1.length===0) ){
								req.flash("error", "No such user exist")
								res.redirect("/issues/" + issue_id)
							} else{
								let usr_id = null
								if(username){
									usr_id = result1[0].id
								}
								
								let arr = [req.body.summary, Number(req.body.priority), Number(req.body.status), usr_id, issue_id]
								connection.query(query2, arr, (err2,result2,fields2)=>{
									if(err2){
										req.flash("error", "Couldn't update, member assigned issue is not member of project")
										res.redirect("/issues/" + issue_id)
									} else{
										req.flash("success", "Successfuly edited issue")
										res.redirect('/issues/' + issue_id)
									}
								})
							}
						})
					} else{
						let query2 = `UPDATE issue SET summary= ?, priority= ? WHERE id= UUID_TO_BIN(?)`
							
						let arr = [req.body.summary, Number(req.body.priority), issue_id]
						connection.query(query2, arr, (err2,result2,fields2)=>{
							if(err2){
								req.flash("error", "Couldn't update issue")
								res.redirect("/issues/" + issue_id)
							} else{
								req.flash("success", "Successfuly edited issue")
								res.redirect('/issues/' + issue_id)
							}
						})
					}
				}
			})
		}
	})
})

router.delete('/:id', secured, Head, (req,res)=>{
	let issue_id = req.params.id

	let query = `DELETE FROM issue WHERE id= UUID_TO_BIN(?)`
	connection.query(query, [issue_id], (err,result,fields)=>{
		if(err){
			req.flash("error", "Couldn't delete issue")
			res.redirect("/issues/" + issue_id)
		} else{
			req.flash("success", "Issue deleted successfuly")
			res.redirect("/issues")
		}
	})
})

router.get('/:id/edit', secured, Assigned, (req,res)=>{
	let issue_id = req.params.id
	let query1 = `SELECT project_id FROM issue WHERE id=UUID_TO_BIN(?)`
	let query2 = `SELECT username FROM (SELECT person_id FROM work WHERE project_id= ?) AS T1 INNER JOIN people_info ON T1.person_id=people_info.id`
	let query3 = `SELECT * FROM issue WHERE id= UUID_TO_BIN(?)`
	let query4 = `SELECT username FROM people_info WHERE id= ?`

	connection.query(query1, [issue_id], (err1,result1,fields1)=>{
		if( err1 || result1.length===0 ){
			req.flash("error", "No such issue exist")
			res.redirect("/issues")
		} else{
			let project_id = result1[0].project_id;

			connection.query(query2, [project_id], (err2,result2,fields2)=>{
				if(err2){
					req.flash("error", "Server error")
					res.redirect("/issues/" + issue_id)
				} else{
					connection.query(query3, [issue_id], (err3,result3,fields3)=>{
						if(err3){
							req.flash("error", "Server error")
							res.redirect("/issues/" + issue_id)
						} else{
							let assigned_to = result3[0].assigned_to
	
							connection.query(query4, [assigned_to], (err4,result4,fields4)=>{
								if(err4){
									req.flash("error", "Server error")
									res.redirect("/issues/" + issue_id)
								} else{
									if(assigned_to){
										result3[0].assigned_to = result4[0].username
									} else{
										result3[0].assigned_to = null
									}									
									res.render('edit-issue', { users: result2, issue_id: issue_id, issue_info: result3[0], project_id: project_id})
								}
							})
						}
					})
				}
			})
		}
	})
})

router.get('/:id/description', secured ,(req,res)=>{
	let issue_id = req.params.id
	let options = {
		root: __dirname + '/../uploads',
		headers: {
			'Content-type': 'application/pdf'
		}
	}

	let filename = path.format({
		base: issue_id + '.pdf'
	})
	
	res.sendFile(filename, options, (err)=>{
		if(err){
			req.flash("error", "No description for this issue")
			res.redirect("/issues/" + issue_id)
		}	
	})

})


module.exports = router