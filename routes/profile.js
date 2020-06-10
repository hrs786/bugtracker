const express = require('express')
const secured = require('../lib/middleware/secured')
const api = require('../lib/api/auth0-api')

const router = express.Router()

router.get('/', secured, (req,res)=>{
    const { _raw, _json, ...userProfile } = req.user;

    api('GET','users/' + encodeURIComponent(userProfile.user_id)).then(body=>{
      let data = JSON.parse(body)
      
      res.render('profile', {
        email: data.email,
        username: data.username
      });
    }).catch(err=>{
      console.log("catch block here");
      console.log(err);
    })
})

module.exports = router