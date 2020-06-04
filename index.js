var express = require('express')
var app = express()
var bodyParser = require('body-parser')

var issues = require('./routes/issues')
var projects = require('./routes/projects')

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

app.use('/issues',issues)
app.use('/projects',projects)

app.get('/progress',(req,res)=>{
	res.send("u r on progress page")
})


app.listen(8080)