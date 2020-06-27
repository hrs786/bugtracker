const connection = require('../../db.js')

const check = (req, res, next) => {
    if(req.isAuthenticated()){
    
        let val = false    

        const { _raw, _json, ...userProfile } = req.user;        
        
        let id = (userProfile.user_id).substr(6)        

        let query = `SELECT username FROM people_info WHERE id=?`
        connection.query(query, [id], (err,result,fields)=>{
            if(err || result.length===0 ){
                req.flash("error", "Server error")
                res.redirect("/dashboard")
            } else{
                if(result[0].username === 'admin'){
                    val = true
                }
                res.locals.isAdmin = val
            }
        })
    }

    next();
};


module.exports = check