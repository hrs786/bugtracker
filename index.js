var express = require('express')
var app = express()
var bodyParser = require('body-parser')
var mysql = require('mysql')

var connection = mysql.createConnection({
	host:'localhost',
	user:'root',
	password:'!matka!',
	database:'bugtracker'
})

app.use(express.static('./public'))
app.use(bodyParser({extended:true}))
app.set('view engine','pug')

app.get('/',(req,res)=>{
	res.send("Home")
})

app.get('/about',(req,res)=>{
	res.send("you are on about page")
})

app.get('/dashboard',(req,res)=>{
	res.render('dashboard')
})

app.get('/issues',(req,res)=>{
	let query = `SELECT id,status,priority,summary FROM issue`
	connection.query(query,(err,result,fields)=>{
		res.render('issues',{issues:result})
	})
})

app.get('/projects',(req,res)=>{
	let query = `SELECT * FROM project`
	connection.query(query,(err,result,fields)=>{
		res.render('projects',{projects:result})
	})
})

app.get('/projects/:id',(req,res)=>{
	project_id=req.body.id
	res.render('projects-options',{project_id:project_id});
})

app.get('/progress',(req,res)=>{
	res.send("u r on progress page")
})

app.listen(8080)