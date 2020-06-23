const express = require('express')
const secured = require('../lib/middleware/secured')
const connection = require('../db.js')

const router = express.Router()

router.get('/',(req,res)=>{
	res.redirect('/home.html')
})

router.get('/dashboard', secured, (req, res, next) => {
	let query = ""
	connection.query(query, (err,result,fields)=>{
		res.render('dashboard');
	})	
});


module.exports = router