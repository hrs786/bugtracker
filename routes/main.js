const express = require('express')
const secured = require('../lib/middleware/secured')
const connection = require('../db.js')

const router = express.Router()

router.get('/',(req,res)=>{
	res.send("Home")
})

router.get('/about',(req,res)=>{
	res.send("you are on about page")
})

router.get('/dashboard', secured, (req, res, next) => {
	let query = ""
	connection.query(query, (err,result,fields)=>{
		res.render('dashboard');
	})	
});

router.get('/progress', secured, (req,res)=>{
	res.send("u r on progress page")
})


module.exports = router