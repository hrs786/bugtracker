const express = require('express')
const secured = require('../middleware/secured')

const router = express.Router()


router.get('/',(req,res)=>{
	res.send("Home")
})

router.get('/about',(req,res)=>{
	res.send("you are on about page")
})

router.get('/dashboard', secured, (req, res, next) => {
	const { _raw, _json, ...userProfile } = req.user;
	console.log(userProfile);
	
	res.render('dashboard', {
		title: 'Profile',
		userProfile: userProfile
	});
});

router.get('/progress', secured, (req,res)=>{
	res.send("u r on progress page")
})

router.get('/terms',(req,res)=>{
	res.send("you r on privacy policy page")
})

module.exports = router