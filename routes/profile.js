const express = require('express')
const url = require('url')
const path = require('path')
const bodyParser = require('body-parser')
const methodOverride = require('method-override')
const secured = require('../lib/middleware/secured')
const api = require('../lib/api/auth0-api')
require('dotenv').config({ path: path.resolve(__dirname,'../../.env')})


const router = express.Router()
router.use(bodyParser.urlencoded({extended: true}))
router.use(methodOverride('_method'))


const protocol = 'https'
const host = process.env.AUTH0_DOMAIN
const path_audience = '/api/v2/'


router.get('/', secured, (req,res)=>{
  const { _raw, _json, ...userProfile } = req.user;

  let pth = 'users/' + encodeURIComponent(userProfile.user_id)
  let pathEndPoint = path_audience + pth
  let urlEndPoint = url.format({
    protocol: protocol,
    host: host,
    pathname: pathEndPoint
  })

  let optionsEndPoint = {
    method: 'GET',
    url: urlEndPoint,
    headers: {'content-type': 'application/json', authorization: 'auth_token'}
  };
  

  api(optionsEndPoint).then(body=>{
    let data = JSON.parse(body)
    
    res.render('profile', {
      email: data.email,
      username: data.username,
      name: data.name
    });

  }).catch(err=>{
    console.log("catch block here");
    console.log(err);
  })
})


router.put('/', secured, (req,res)=>{
  const { _raw, _json, ...userProfile } = req.user;
  // check passwd1 = passwd2 ??????????????
  
  // update name
  let personName = req.body.personName
  let endPointBody = { "name": personName}

  // update password
  let new_passwd = req.body.password1
  if(new_passwd !== "" && new_passwd !== null){
    endPointBody["password"] = new_passwd
  }

  
  endPointBody = JSON.stringify(endPointBody)

  let pth = 'users/' + encodeURIComponent(userProfile.user_id)
  let pathEndPoint = path_audience + pth
  let urlEndPoint = url.format({
    protocol: protocol,
    host: host,
    pathname: pathEndPoint
  })

  let optionsEndPoint = {
    method: 'PATCH',
    url: urlEndPoint,
    headers: {'content-type': 'application/json', authorization: 'auth_token'},
    body: endPointBody
  };

  api(optionsEndPoint).then(body=>{
    let data = JSON.parse(body)
    
    res.redirect('/profile')}).catch(err=>{
    console.log("catch block here");
    console.log(err);
  })
})


module.exports = router