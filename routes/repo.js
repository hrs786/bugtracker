const express = require('express')
const bodyParser = require('body-parser')
const methodOverride = require('method-override')

const connection = require('../db')
const secured = require('../lib/middleware/secured')
const Admin = require('../lib/middleware/Admin')

const router = express.Router()
router.use(bodyParser.urlencoded({ extended: true}))
router.use(methodOverride('_method'))


router.get('/', secured, (req,res)=>{
    let query = `SELECT id, name, link FROM project`

    connection.query(query, (err,results,fields)=>{
        if(err){
            req.flash("error", "Server error")
            res.redirect("/dashboard")
        } else{
            res.render('repo-list', {projects: results})
        }
    })
})

router.put('/:id', secured, Admin, (req,res)=>{
    let project_id = req.params.id
    let repo_url = req.body.repo_link

    let query = `UPDATE project SET link= ? WHERE id= ?`
    let arr = [repo_url, project_id]

    // check valid URL
    var pattern = new RegExp('^(https?:\\/\\/)?'+ // protocol
        '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|'+ // domain name
        '((\\d{1,3}\\.){3}\\d{1,3}))'+ // OR ip (v4) address
        '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*'+ // port and path
        '(\\?[;&a-z\\d%_.~+=-]*)?'+ // query string
        '(\\#[-a-z\\d_]*)?$','i'); // fragment locator
    
    if(!!pattern.test(repo_url)){   // true
        connection.query(query, arr, (err,result,fields)=>{
            if(err || result.affectedRows === 0){
                req.flash("error", "No such project")
                res.redirect("/repositories")
            } else{
                req.flash("success", "Successfully updated repo link")
                res.redirect("/repositories")
            }
        })
    } else{ // false
        req.flash("error", "Enter valid URL")
        res.redirect("/repositories")
    }
})

module.exports = router