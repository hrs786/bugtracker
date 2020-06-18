const check = (req, res, next) => {    
    res.locals.isAuthenticated = req.isAuthenticated();
    next();
};


module.exports = check