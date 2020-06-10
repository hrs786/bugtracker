const request = require("request");
const util = require('util')
const url = require('url')
const path = require('path')
const dotenv = require('dotenv').config({ path: path.resolve(__dirname,'../../.env')})


// function to get API key and request specific end point of API
function requestP(mthd, pth){

  const protocol = 'https'
  const host = process.env.AUTH0_DOMAIN
  const path_req = '/oauth/token'
  const path_audience = '/api/v2/'

  var urlToSend = url.format({
    protocol:protocol,
    host:host,
    pathname:path_req
  })
  var urlAudience = url.format({
    protocol:protocol,
    host:host,
    pathname:path_audience
  })

  var options = {
    method: 'POST',
    url: urlToSend,
    headers: {'content-type': 'application/x-www-form-urlencoded'},
    form: {
      grant_type: 'client_credentials',
      client_id: process.env.AUTH0_API_CLIENT_ID,
      client_secret: process.env.AUTH0_API_CLIENT_SECRET,
      audience: urlAudience
    }
  };

  return new Promise((resolve, reject)=>{

    //request API key
    request(options, function (error, response, body) {
      if (error){
        reject(error)
      } else if(response.statusCode!=200){
        reject(new Error(`Network request returned status code ${response.statusCode}`));
      }
    
      let token = JSON.parse(body).access_token
      
      let auth_token = 'Bearer ' + token
    
      let pathEndPoint = path_audience + pth
      let urlEndPoint = url.format({
        protocol: protocol,
        host: host,
        pathname: pathEndPoint
      })

      let optionsEndPoint = {
        method: mthd,
        url: urlEndPoint,
        headers: {'content-type': 'application/json', authorization: auth_token}
      };
      

      //request end point
      request(optionsEndPoint, function (err, res, body2) {
        if (err){
          reject(err)
        } else if(res.statusCode!=200){
          reject(new Error(`Network request returned status code ${response.statusCode}`));
        }else{
          resolve(body2)
        }
        
      });
    
    });

  })
}


module.exports = requestP