const express = require('express');
const apirouter = express.Router();

const pool = require("../packages/dbconn")

const jwt = require("jsonwebtoken");


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

apirouter.post("/logout",async(req,res)=>{
    try{
        res.clearCookie("token")
        res.json({
            "code":"0",
            "data":'Logout Success'
        })

    }catch(err)
    {
        res.json({
            "code":"-1",
            "data":'Logput Failed'
        })
    }
})

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

        result = await pool.query(`SELECT * FROM tbl_blocked_friendships WHERE ((senderid = $1 AND receiverid = $2) OR (senderid = $2 AND receiverid = $1)) AND status = 'blocked' ORDER BY id DESC LIMIT 1;`,[data.senderid,data.receiverid]);
        if(result.rows.length==0)
        {
            result = await pool.query("SELECT * FROM tbl_friend_requests WHERE ((sender_id = $1 AND receiver_id = $2) OR (sender_id = $2 AND receiver_id = $1)) AND status != 'blocked' ORDER BY id LIMIT 1;",[data.senderid,data.receiverid])
            
            if(result.rows.length==0 || result.rows[0]["status"]=="rejected"){
                result = await pool.query("INSERT INTO tbl_friend_requests(sender_id, receiver_id, status) VALUES ($1, $2, 'pending');",[data.senderid,data.receiverid])
                res.json({
                    "code":"0",
                    "data":"Request Sended Successfully"
                })
            }
            else if(result.rows[0]["status"]=="pending")
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
            else{
                res.json({
                    "code":"-1",
                    "data":`Invalid status ${result}`
                })
            }
        }
        else if(result.rows[0]["status"]=="blocked")
        {
            if(result.rows[0]["senderid"]==data.senderid)
            {
                res.json({
                    "code":"0",
                    "data":"he blocked you"
                })
            }
            else
            {
                res.json({
                    "code":"0",
                    "data":"You blocked he"
                })
            }
        }
        else
        {
            console.log("SOME OTHER STATE")
            res.json({
                "code":"-1",
                "data":`Invalid status ${result.rows}`
            })
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

        if(data.status=="blocked")
        {   
            result = await pool.query("SELECT * FROM tbl_blocked_friendships WHERE ((senderid = $1 AND receiverid = $2) OR (senderid = $2 AND receiverid = $1)) AND status = 'blocked' ORDER BY id DESC LIMIT 1;",[data.senderid,data.receiverid])
            console.log(result.rows)
            
            if(result.rows.length==0)
            {
                result = await pool.query("INSERT INTO tbl_blocked_friendships (senderid,receiverid,status) VALUES($1,$2,$3)",[data.senderid,data.receiverid,data.status])
                result = await pool.query("UPDATE tbl_friendships SET status = $3 WHERE (senderid = $1 AND receiverid = $2) OR (senderid = $2 AND receiverid = $1)",[data.senderid,data.receiverid,data.status])
                result = await pool.query("UPDATE tbl_friend_requests SET status = $3 WHERE (sender_id = $1 AND receiver_id = $2) OR (sender_id = $2 AND receiver_id = $1)",[data.senderid,data.receiverid,data.status])
                
            }else{
                console.log("ALREADY BLOCKED")
                res.json({
                    "code":"1",
                    "userid":data.receiverid,
                    "data":`Already he blocked you`
                })
                return;
            }

        }else if(data.status=="unblocked"){
            console.log(data.senderid,data.receiverid,data.status)
            result = await pool.query("UPDATE tbl_blocked_friendships SET status = $3 WHERE senderid = $1 AND receiverid = $2",[data.senderid,data.receiverid,data.status])
        }
        else{
            result = await pool.query("UPDATE tbl_friend_requests SET status = $3 WHERE sender_id = $1 AND receiver_id = $2",[data.senderid,data.receiverid,data.status])
            if(data.status=="accepted")
            {
                result = await pool.query("INSERT INTO tbl_friendships(senderid,receiverid,status) VALUES ($1,$2,$3)",[data.senderid,data.receiverid,data.status])
                result = await pool.query("INSERT INTO tbl_chatrooms(type) VALUES ('private') RETURNING id")

                const roomId = result.rows[0].id;
                await pool.query(
                `
                INSERT INTO tbl_chatrooms_members(room_id, user_id)
                VALUES
                ($1,$2),
                ($1,$3)
                `,
                [
                roomId,
                data.senderid,
                data.receiverid
                ]
                );
            }
        }
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


apirouter.get("/getroomid/:userid/:ourid",async (req,res)=>{
    try{
        let userid = req.params.userid;
        let ourid = req.params.ourid;

        let result = null;

        result = await pool.query(`SELECT cm.room_id
            FROM tbl_chatrooms_members cm
            JOIN tbl_chatrooms c
            ON c.id = cm.room_id
            WHERE c.type = 'private'
            AND cm.user_id IN ($1, $2)
            GROUP BY cm.room_id
            HAVING COUNT(DISTINCT cm.user_id) = 2;`,[userid,ourid])

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
            FROM tbl_friendships fr
            JOIN tbl_users u
            ON (
                fr.senderid = $1 AND u.id = fr.receiverid
                OR
                fr.receiverid = $1 AND u.id = fr.senderid
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

apirouter.get("/blockedlist/:userid",async (req,res)=>{
    try{
        let userid = req.params.userid;

        let result = null;

        result = await pool.query(`
            SELECT
                u.id,
                u.username
            FROM tbl_blocked_friendships fr
            JOIN tbl_users u
            ON (
                fr.receiverid = $1 AND u.id = fr.senderid
            )
            WHERE fr.status = 'blocked';`,
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

apirouter.get("/getmessage/:roomid/:before",async (req,res)=>{
    try{
        let roomid = Number(req.params.roomid);

        let before = Number(req.params.before);

        let result = null;

        if(before==0)
        {
            result = await pool.query(`SELECT * FROM tbl_private_messages WHERE room_id = $1 ORDER BY id DESC LIMIt 40;`,[roomid])
        }
        else
        {
            result = await pool.query(`SELECT * FROM tbl_private_messages WHERE room_id = $1 AND id < $2 ORDER BY id DESC LIMIT 40;`,[roomid,before])
        }

        // console.log(result)
    
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


module.exports = apirouter;