const connection = require('../../db.js')

const check = (req, res, next) => {
    if(req.isAuthenticated()){
    
        let val = false    

        const { _raw, _json, ...userProfile } = req.user;
    
        let issue_id = req.params.id
        let user_id = (userProfile.user_id).substr(6)
        let query1 = `SELECT project_id FROM issue WHERE id= UUID_TO_BIN(?)`
        let query2 = `SELECT head_id FROM project WHERE id=?`
                
        connection.query(query1, [issue_id], (err1,result1,fields1)=>{
            if(err1 || result1.length===0 ){                                
                req.flash("error", "No such issue exist")
                res.redirect("/issues")
            } else{
                let project_id = result1[0].project_id

                connection.query(query2, [project_id], (err2,result2,fields2)=>{
                    if(err2){
                        req.flash("error", "Server error")
                        res.redirect("/issues")
                    } else{
                        if(result2[0].head_id === user_id){
                            val = true
                        }
                        res.locals.isHead = val;
                    }
                })
            }
        })
    }

    next();
};


module.exports = check