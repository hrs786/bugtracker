const express = require('express')
const path = require('path')
const bodyParser = require('body-parser')
const connection = require('../db')
const secured = require('../lib/middleware/secured')
const Head = require('../lib/middleware/Head')
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
		results.forEach((result)=>{
			result.status = issue_status[result.status]
			result.priority = issue_priority[result.priority]
		})
		
		
		res.render('issues',{issues:results, srch: true, notShow: true})
	})
})

router.get('/search', secured, (req,res)=>{
	let issue_id = req.query.search
	
	let route = '/issues/' + issue_id	
	res.redirect(route)
})

router.get('/:id', secured, (req,res)=>{	
	let issue_id = [req.params.id]
	let query1 = `SELECT BIN_TO_UUID(id) AS id,summary,opened_by,open_date,end_date,assigned_to,status,priority,project_id,description FROM issue WHERE id = UUID_TO_BIN(?)`
	let query2 = `SELECT username from people_info WHERE id= ?`
	connection.query(query1, issue_id, (err1,results1,fields1)=>{
		if(err1){
			throw err1
		}

		results1.forEach((result)=>{
			result.status = issue_status[result.status]
			result.priority = issue_priority[result.priority]
		})
		let open_user = results1[0].opened_by
		let assigned_user = results1[0].assigned_to
		
		connection.query(query2, [open_user], (err2,result2,fields2)=>{
			if(err2){
				throw err2
			}

			open_user = result2[0].username
			connection.query(query2, [assigned_user], (err3,result3,fields3)=>{
				if(err3){
					throw err3
				}

				if(assigned_user){
					assigned_user = result3[0].username
				} else{
					assigned_user = '[NOT ASSIGNED]'
				}

				res.render('issue-info',{issue: results1, open_user: open_user, assigned_user: assigned_user})
			})
		})
	})
})

router.put('/:id', secured, (req,res)=>{
	let issue_id = req.params.id
	let username = req.body.usr
	
	let query1 = `SELECT id FROM people_info WHERE username= ?`
	let query2 = `UPDATE issue SET summary= ?, priority= ?, assigned_to= ? WHERE id= UUID_TO_BIN(?)`

	connection.query(query1, [username], (err1,result1,fields1)=>{
		if(err1){
			throw err1
		}
		let usr_id = null
		if(username){
			usr_id = result1[0].id
		}
		
		let arr = [req.body.summary, Number(req.body.priority), usr_id, issue_id]
		connection.query(query2, arr, (err2,result2,fields2)=>{
			if(err2){
				throw err2
			}

			res.redirect('/issues/' + issue_id)
		})
	})
})

router.get('/:id/edit', secured, Head, (req,res)=>{
	let issue_id = req.params.id
	let query1 = `SELECT project_id FROM issue WHERE id=UUID_TO_BIN(?)`
	let query2 = `SELECT username FROM (SELECT person_id FROM work WHERE project_id= ?) AS T1 INNER JOIN people_info ON T1.person_id=people_info.id`
	let query3 = `SELECT * FROM issue WHERE id= UUID_TO_BIN(?)`
	let query4 = `SELECT username FROM people_info WHERE id= ?`

	connection.query(query1, [issue_id], (err1,result1,fields1)=>{
		if(err1){
			throw err1
		}
		let project_id = result1[0].project_id;

		connection.query(query2, [project_id], (err2,result2,fields2)=>{
			if(err2){
				throw err2
			}
			
			connection.query(query3, [issue_id], (err3,result3,fields3)=>{
				if(err3){
					throw err3
				}
				let assigned_to = result3[0].assigned_to

				connection.query(query4, [assigned_to], (err4,result4,fields4)=>{
					if(err4){
						throw err4
					}

					if(assigned_to){
						result3[0].assigned_to = result4[0].username
					} else{
						result3[0].assigned_to = null
					}

					res.render('edit-issue', { users: result2, issue_id: issue_id, issue_info: result3[0], project_id: project_id})
				})
			})
		})
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