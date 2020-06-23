const connection = require('../../db.js')

const check = (req, res, next) => {
    if(req.isAuthenticated()){
    
        let val = false    

        const { _raw, _json, ...userProfile } = req.user;
    
        let project_id = req.params.id
        let user_id = (userProfile.user_id).substr(6)
        let query1 = `SELECT head_id FROM project WHERE id=?`

        connection.query(query1, [project_id], (err1,result1,fields1)=>{
            
            if(result1[0].head_id === user_id){
                val = true
            }
            res.locals.isHead = val;
        })
    }

    next();
};


module.exports = check