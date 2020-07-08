const express = require('express')
const secured = require('../lib/middleware/secured')
const connection = require('../db.js')

const router = express.Router()

router.get('/',(req,res)=>{
	res.redirect('/home.html')
})

router.get('/dashboard', secured, (req, res, next) => {
	const { _raw, _json, ...userProfile } = req.user;
	let user_id = (userProfile.id).substring(6)	
	
	let query = `SELECT id AS Id, name AS Name FROM project INNER JOIN work ON project.id=work.project_id WHERE work.person_id= ?`
	let query2 = `SELECT BIN_TO_UUID(id) AS id, summary FROM issue WHERE assigned_to= ?`
	connection.query(query, [user_id], (err,result,fields)=>{
		if(err){
			req.flash("error", "Server error")
			res.redirect("/profile")
		} else{
			connection.query(query2, [user_id], (err2,result2,fields2)=>{
				if(err2){
					req.flash("error", "Server error")
					res.redirect("/profile")
				} else{
					res.render('dashboard', {projects: result, issues: result2});
				}
			})
		}
	})	
});


module.exports = router