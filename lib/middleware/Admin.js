const connection = require('../../db.js')

const Admin = (req,res,next)=>{
    const { _raw, _json, ...userProfile } = req.user;
    
    let id = (userProfile.user_id).substr(6)    

    let query = `SELECT username FROM people_info WHERE id=?`
    connection.query(query, [id], (err,result,fields)=>{
        
        if(result[0].username === 'admin'){
            return next()
        }
        
        res.redirect('/projects') // handle better
        
    })
}

module.exports = Admin