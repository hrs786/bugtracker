const express = require('express')
const secured = require('../middleware/secured')

const router = express.Router()

router.get('/', (req,res)=>{
    res.render('profile')
})

module.exports = router