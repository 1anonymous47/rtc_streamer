const jwt = require("jsonwebtoken");

const SCRETKEY = process.env.SCRETKEY


function verifyjwt(req,res,next)
{
    const token = req.cookies.token;

    if(!token)
    {
        res.redirect("/")
    }
    else{
        jwt.verify(
            token,
            SCRETKEY,
            (err)=>{
                if(err)
                {
                    res.redirect("/")
                }
                else
                {
                    console.log("WHY REDIRECTION")
                    next();
                }
            }
        )
    }
}

module.exports = verifyjwt