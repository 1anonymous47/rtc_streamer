from flask import Flask,render_template,request,jsonify
from flask_socketio import SocketIO, send, emit, join_room, leave_room


app = Flask(__name__)
socketio = SocketIO(app)

ROOMS = {}

ICELIST = {}

@app.route("/test")
def test():
    return "Service is running......"

@app.route("/")
def main():
    return render_template("caller.html")



@socketio.on('createoffer')
def createcall(data):
    if data["roomid"] not in ROOMS:
        ROOMS[data["roomid"]]=[]
        payload = {
            "socket":request.sid,
            "sdp":data["sdp"]
        }
        ROOMS[data["roomid"]].append(payload)
        print("Rom create")
    else:
        print("Room already found")

@socketio.on('getoffer')
def createcall(data):
    if data["roomid"] in ROOMS:
        payload = {
            "status":1,
            "sdp":ROOMS[data["roomid"]][0]["sdp"]
        }
        socketio.emit("receiveoffer",payload,to=request.sid)
    else:
        payload = {
            "status":-1,
            "data":"No room found"
        }
        socketio.emit("receiveoffer",payload,to=request.sid)

@socketio.on('createanswer')
def createanswer(data):
    store_data = {
        "socket":request.sid,
        "sdp":data["sdp"]
    }
    ROOMS[data["roomid"]].append(store_data)
    payload = {
        "status":1,
        "answer":ROOMS[data["roomid"]][1]["sdp"]
    }
    socketio.emit("receiveanswer",payload,to=ROOMS[data["roomid"]][0]["socket"])

@socketio.on('shareice')
def shareice(data):
    if len(ROOMS[data["roomid"]])>1:
        # print("why")
        socketio.emit("receiveice",data["icedata"],to=ROOMS[data["roomid"]][data["side"]]["socket"])

@socketio.on('disconnect')
def handle_disconnect():
    
    print("user disconnected")

if __name__ == '__main__':
    socketio.run(app, debug=True,host="0.0.0.0")
