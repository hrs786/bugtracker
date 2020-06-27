const connection = require('../../db.js')

const Admin = (req,res,next)=>{
    const { _raw, _json, ...userProfile } = req.user;
    
    let id = (userProfile.user_id).substr(6)    

    let query = `SELECT username FROM people_info WHERE id=?`
    connection.query(query, [id], (err,result,fields)=>{
        if( err || result.length===0 ){
            req.flash("error", "Server error")
            res.redirect("/dashboard")
        } else{
            if(result[0].username === 'admin'){
                return next()
            } else{
                req.flash("error", "Permission denied")
                res.redirect('/projects')
            }
        }
        
    })
}

module.exports = Admin