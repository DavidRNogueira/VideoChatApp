const express = require("express");
const app = express();

const path = require('path')
const server = app.listen(5000)
const io = require('socket.io')(server);

app.use(express.static(path.join(__dirname ,"client" , "build")))

app.get("/" , (req, res)=>{
    res.sendFile(path.join(__dirname ,"client" , "build" , "index.html"));
})

let users = {}

io.on("connection" , (socket) => {
    if (!users[socket.id]){
        users[socket.id] = socket.id
    }

    socket.emit("yourID" , socket.id)
    socket.emit("allUsers" , users)
    socket.broadcast.emit("allUsers" , users)

    socket.on("callUser" , (data) => {
        io.to(data.userToCall).emit("incomingCall" , {signal: data.signalData , from: data.from})
    })

    socket.on("acceptCall" , data => {
        io.to(data.to).emit("callAccepted" , data.signal);
    })

    socket.on("disconnect" , () => {
        delete users[socket.id];
        socket.broadcast.emit("allUsers" , users)
    })
})




