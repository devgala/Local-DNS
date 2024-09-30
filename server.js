
const dnsPacket = require("dns-packet");
const dgram = require("node:dgram");
const server = dgram.createSocket("udp4");

/**
 * need to use sudo on linux as it doesnt assign ports below 1024 without sudo
 */

const db = {
  "go-google": {
    data: 'google.com'
  },
};
var port = 1025;
var query_adderss
var questions = {}
server.on("message", (msg, rinfo) => {
    
  const incomingReq = dnsPacket.decode(msg);
  console.log('Message From :',rinfo.address,rinfo.port,'Query: ',incomingReq.questions[0].name)
  console.log(incomingReq,rinfo);

  if(incomingReq.questions[0].name=='go-google'){
    
     port = rinfo.port
     questions = incomingReq.questions
     query_adderss = rinfo.address
    const resolvedName = db[incomingReq.questions[0].name];
    console.log('Message From :',rinfo.address,rinfo.port,'Query: ',incomingReq.questions[0].name,resolvedName)
    const query = dnsPacket.encode({
        type:'query',
        id: incomingReq.id,
        flags : incomingReq.flags,
        questions: [{
            type: incomingReq.questions[0].type,
            class: incomingReq.questions[0].class,
            name:resolvedName.data
        }]
    })

    server.send(query,53,'4.2.2.2',(err,bytes)=>console.log('error' ,bytes, err))
  }else{
    const ans = incomingReq
    ans.questions = questions
    server.send(dnsPacket.encode(ans), port,query_adderss,(err,bytes)=>console.log('Return error ',bytes,err));
  }



});

server.on('listening', () => {
    const address = server.address();
    console.log(`server listening ${address.address}:${address.port}`);
  });

server.on('error',(err)=>console.log('Error ',err ))
server.bind(53, () => console.log("DNS Server is running on port 53"));