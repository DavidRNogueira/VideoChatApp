import React , {useState, useEffect, useRef} from 'react';
import io from 'socket.io-client';
import Peer from "simple-peer";


function App() {

  const [myId , setMyId] = useState();  
  const [stream , setStream] = useState();
  const [users , setUsers] = useState([])
  const [incomingCall , setIncomingCall] = useState(false);
  const [userCalling , setUserCalling] = useState("");
  const [callerSignal , setCallerSignal] = useState();

  const userVideo = useRef();
  const partnerVideo = useRef();
  const socket = useRef();

  useEffect(()=>{
    socket.current = io.connect("/")
    let video = document.querySelector("#vid");
      if (navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices.getUserMedia({ video: true , audio:true })
          .then(function (stream) {
            setStream(stream);
            if (userVideo.current){
              userVideo.current.srcObject = stream;
            }
          })

          .catch(function (err0r) {
            console.log("Something went wrong!");
          });
  }
    socket.current.on("yourID" , (data) => {
      setMyId(data);
    })

    socket.current.on("allUsers" , (data) => {
      setUsers(Object.keys(data))
    })

    socket.current.on("incomingCall" , (data) => {
      setIncomingCall(true);
      setUserCalling(data.from)
      setCallerSignal(data.signal)
    })
} , [])

  const callPeer = (id) => {
    const peer = new Peer({
      initiator: true ,
      trickle: false,
      stream: stream
    })
    peer.on("signal" , (data) => {
      socket.current.emit("callUser" , {userToCall : id , signalData : data , from : myId })
    })

    peer.on("stream" , stream => {
      if (partnerVideo.current){
        partnerVideo.current.srcObject = stream;
      }
    })

    socket.current.on("callAccepted" , signal => {
      peer.signal(signal);
      console.log(signal);
    })
  }

  const acceptCall = () => {
    setIncomingCall(false);
    const peer = new Peer({
      initiator:false,
      trickle:false,
      stream: stream
    })

    peer.on("signal" , data => {
      socket.current.emit("acceptCall" , {signal: data , to: userCalling})
    })

    peer.on("stream" , stream => {
        partnerVideo.current.srcObject = stream;
    })

    peer.signal(callerSignal)
  }

  return (
    <div className="mainDiv">
      <h1 className="friendsOnline">Friends Online</h1>
      {
        users && users.length > 0 && 
      <div className="friendsDiv">
        {
          users.map(user => {
            if (user === myId){
              return;
            }
            return(
            <a href="" className="callFriendBtn" onClick={(e) => {e.preventDefault(); callPeer(user)}}>Call {user}</a>
            )
          })
        }
      </div>
      }
      <div className="videosDiv">
        <div id="container">
          <video autoPlay muted id="vid" ref={userVideo}/>
        </div>
        <div id="container">
          <video autoPlay="true" id="friendVid" ref={partnerVideo}/>
        </div>
      </div>
      {
        incomingCall && 
        <div>
          <h1>You are receiving a call from {userCalling}!</h1>
          <button onClick={acceptCall} >Accept Call</button>
        </div>
      }
    </div>
  );
}

export default App;
