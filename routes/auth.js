/*
 - Required External Modules
 */

const express = require("express");
const router = express.Router();
const passport = require("passport");
const util = require("util");
const url = require("url");
const querystring = require("querystring");
const api = require('../lib/api/auth0-api')

require("dotenv").config();

const connection = require('../db')

/*
 - Routes Definitions
 */


router.get("/login",
    passport.authenticate("auth0", {
        scope: "openid email profile"
    }),
    (req, res) => {
        res.redirect("/");
    }
);


router.get("/callback", (req, res, next) => {
    passport.authenticate("auth0", (err, user, info) => {
        if (err) {
            return next(err);
        }
        if (!user) {
            return res.redirect("/login");
        }


        const { _raw, _json, ...userProfile } = user;


        // API
        const protocol = 'https'
        const host = process.env.AUTH0_DOMAIN
        const path_audience = '/api/v2/'

        // get username and login count
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
            
            let chk = data.logins_count
            
            // signup - 1st login --> add data to db and force logout
            // otherwise this session calls multiple insert to database -> error
            if(chk === 1){
                let arr = [data.identities[0].user_id, data.username]
                let query = `INSERT INTO people_info(id,username) values (?,?)`
                connection.query(query, arr, (err,result,fields)=>{
                    if(err){
                        throw err
                    }
                })
                res.redirect('/logout')
            } else{
                // login
                req.logIn(user, (err) => {
                    if (err) {
                        return next(err);
                    }
                    const returnTo = req.session.returnTo;
                    delete req.session.returnTo;
                    res.redirect(returnTo || "/dashboard");
                });
            }

        }).catch(err=>{
            console.log("catch block here");
            console.log(err);
        })
        
    })(req, res, next);
});


router.get("/logout", (req, res) => {
    req.logOut();

    let returnTo = req.protocol + "://" + req.hostname;
    const port = req.connection.localPort;

    if (port !== undefined && port !== 80 && port !== 443) {
        returnTo =
        process.env.NODE_ENV === "production" ? `${returnTo}/` : `${returnTo}:${port}/`;
    }
  
    const logoutURL = new URL(
        util.format("https://%s/logout", process.env.AUTH0_DOMAIN)
    );
    const searchString = querystring.stringify({
        client_id: process.env.AUTH0_CLIENT_ID,
        returnTo: returnTo
    });
    logoutURL.search = searchString;
  
    res.redirect(logoutURL);
});


module.exports = router