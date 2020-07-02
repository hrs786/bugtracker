// Assigned or Head or Admin

const connection = require('../../db.js')

const Head = (req,res,next)=>{
    const { _raw, _json, ...userProfile } = req.user;
    
    let issue_id = req.params.id
    
    let user_id = (userProfile.user_id).substr(6)
    let query1 = `SELECT head_id FROM project INNER JOIN issue ON issue.id=UUID_TO_BIN(?) AND issue.project_id=project.id`
    let query2 = `SELECT username FROM people_info WHERE id=?`
    let query3 = `SELECT assigned_to FROM issue WHERE id= UUID_TO_BIN(?)`

    connection.query(query1, [issue_id], (err1,result1,fields1)=>{
        if( err1 || result1.length===0 ){
            req.flash("error", "Server error")
            res.redirect("/issues/" + issue_id)
        } else{
            connection.query(query2, [user_id],(err2,result2,fields2)=>{
                if( err2 || result2.length===0 ){
                    req.flash("error", "Server error")
                    res.redirect("/issues/" + issue_id)
                } else{
                    connection.query(query3, [issue_id], (err3,result3,fields3)=>{
                        if(err3){
                            req.flash("error", "Server error")
                            res.redirect("/issues/" + issue_id)
                        } else{
                            let flag
                            if(result3.length !==0 ){
                                flag = result3[0].assigned_to === user_id
                            }
                            if(result1[0].head_id === user_id || result2[0].username === 'admin' || flag){
                                return next()
                            } else{
                                req.flash("error", "Permission denied")
                                res.redirect('/dashboard')
                            }
                        }
                    })
                }
            })
        }
        
    })
}

module.exports = Head