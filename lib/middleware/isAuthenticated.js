const connection = require('../../db.js')

const check = (req, res, next) => {    
    res.locals.isAuthenticated = req.isAuthenticated();
    if(req.isAuthenticated()){
        const { _raw, _json, ...userProfile } = req.user; 
        let user_id = (userProfile.user_id).substr(6)        
        
        let query = `SELECT username FROM people_info WHERE id=?`
        connection.query(query, [user_id], (err,result,fields)=>{
            if(err){
                throw err
            }
            
            let username = result[0].username
            res.locals.userIs = username
        })        
    }
    
    next();
};


module.exports = check