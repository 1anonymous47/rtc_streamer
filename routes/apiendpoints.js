const express = require('express');
const apirouter = express.Router();

const pool = require("../packages/dbconn")

const jwt = require("jsonwebtoken")


apirouter.post('/register', async (req, res) => {
    try{
        let  data  = req.body;

        let result = null;

        result = await pool.query("SELECT username,email FROM tbl_users WHERE username = ($1) OR email = ($2)",[data.username, data.email])

        if(result.rows.length!=0)
        {
            if(result["rows"][0]["username"]==data.username)
            {
                res.json({
                    "code":"-1",
                    "data":"Username already exists"
                })
            }
            else if(result["rows"][0]["email"]==data.email)
            {
                res.json({
                    "code":"-1",
                    "data":"Email already exists"
                })
            }
            else{
                res.json({
                    "code":"-1",
                    "data":"Server Error"
                })
            }
        }
        else
        {
            result = await pool.query(
                `INSERT INTO tbl_users (username, email, password)
                VALUES ($1, $2, $3)`,
                [data.username, data.email, data.password]
            );
            res.json({
                "code":"0",
                "data":"Username Registered Successfully"
            })
        }
    }
    catch(err)
    {
        console.log(err);
        res.json({
            "code":"500",
            "data":"Internal Server Error"
        })
    }
});

apirouter.post('/login',async (req, res) => {
    try{
        const data = req.body;

        let result = null;

        result = await pool.query("SELECT id,username FROM tbl_users WHERE username = ($1) AND password = ($2)",[data.username, data.password])
        
        if(result.rows.length === 0)
        {
            res.json({
                "code":"1",
                "data":"Invalid Credntials"
            })
        }
        else
        {  
            const secretKey = process.env.SCRETKEY;
            const options = {
                expiresIn: '1h'
            };

            const token = jwt.sign(options,secretKey);

            res.cookie('token', token, { httpOnly: true });

            res.json({
                "code":"0",
                "data":result.rows[0]
            })
        }
    }
    catch(err)
    {
        console.log(err);
        res.json({
            "code":"500",
            "data":"Internal Server Error"
        })
    }
});

apirouter.get("/users/:userid/:filter",async (req,res)=>{
    try{
        let filter = req.params.filter;
        let userid = req.params.userid;
        let result = null;
        result = await pool.query("SELECT * FROM tbl_users WHERE username LIKE CONCAT(($1)::text, '%') AND id!=$2;",[filter,userid])
        res.json({
            "code":"0",
            "data":result.rows
    })}
    catch(err)
    {
        console.log(err);
        res.json({
            "code":"500",
            "data":"Internal Server Error"
        })
    }
})


apirouter.post("/sendrequest",async(req,res)=>{
    try{
        let data = req.body;

        let result = null;

        result = await pool.query("SELECT * FROM tbl_friend_requests WHERE (sender_id = $1 AND receiver_id = $2) OR (sender_id = $2 AND receiver_id = $1);",[data.senderid,data.receiverid])
        
        if(result.rows.length==0)
        {
            result = await pool.query("INSERT INTO tbl_friend_requests(sender_id, receiver_id, status) VALUES ($1, $2, 'pending');",[data.senderid,data.receiverid])
            res.json({
                "code":"0",
                "data":"Request Sended Successfully"
            })
        }
        else{
            if(result.rows[0]["status"]=="pending")
            {
                res.json({
                    "code":"0",
                    "data":"Request Already Sended"
                })
            }
            else if(result.rows[0]["status"]=="accepted")
            {
                res.json({
                    "code":"0",
                    "data":"Already Your Friends"
                })
            }
            else if(result.rows[0]["status"]=="blocked")
            {
                res.json({
                    "code":"0",
                    "data":"Reuest has been Blocked"
                })
            }
            else{
                res.json({
                    "code":"0",
                    "data":"Invalid Status"
                })
            }
        }
    }catch(err){
        console.log(err);
        res.json({
            "code":"500",
            "data":"Internal Server Error"
        })
    }
})

apirouter.post("/acceptrequesr",async(req,res)=>{
    try{

        let data = req.body;

        let result = null;

        result = await pool.query("UPDATE tbl_friend_requests SET status = $3 WHERE sender_id = $1 AND receiver_id = $2",[data.senderid,data.receiverid,data.status])

        res.json({
            "code":"0",
            "data":`Request ${data.status} Successfully`
        })
    }catch(err){
        console.log(err);
        res.json({
            "code":"500",
            "data":"Internal Server Error"
        })
    }
})

apirouter.get("/requestslist/:userid",async (req,res)=>{
    try{
        let userid = req.params.userid;

        let result = null;

        result = await pool.query(`
            SELECT ur.username,fr.status,ur.id
            from tbl_friend_requests fr 
            JOIN tbl_users ur 
            ON fr.sender_id = ur.id
            WHERE fr.receiver_id = $1`,
            [userid])
        
        res.json({
            "code":"0",
            "data":result.rows
        })
    }catch(err){
        console.log(err);
        res.json({
            "code":"500",
            "data":"Internal Server Error"
        })
    }
})


apirouter.get("/friendslist/:userid",async (req,res)=>{
    try{
        let userid = req.params.userid;

        let result = null;

        result = await pool.query(`
            SELECT
                u.id,
                u.username,
                fr.status
            FROM tbl_friend_requests fr
            JOIN tbl_users u
            ON (
                (fr.sender_id = $1 AND u.id = fr.receiver_id)
                OR
                (fr.receiver_id = $1 AND u.id = fr.sender_id)
            )
            WHERE fr.status = 'accepted';`,
            [userid])
        
        res.json({
            "code":"0",
            "data":result.rows
        })
    }catch(err){
        console.log(err);
        res.json({
            "code":"500",
            "data":"Internal Server Error"
        })
    }
})


// apirouter.route("/request")
// .get((req,res)=>{

// })
// .post((res,res)=>{

// })


module.exports = apirouter;