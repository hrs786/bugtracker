const connection = require('../../db.js')

const check = (req, res, next) => {
    if(req.isAuthenticated()){
    
        let val = false    

        const { _raw, _json, ...userProfile } = req.user;
    
        let issue_id = req.params.id
        let user_id = (userProfile.user_id).substr(6)
        let query = `SELECT * FROM issue WHERE id= UUID_TO_BIN(?)`
                
        connection.query(query, [issue_id], (err,result,fields)=>{
            if(err || result.length===0 ){                                
                req.flash("error", "No such issue exist")
                res.redirect("/issues")
            } else{                
                if(result[0].assigned_to === user_id){
                    val = true
                }
                res.locals.isAssigned = val;
            }
        })
    }

    next();
};


module.exports = check