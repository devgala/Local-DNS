
const dnsPacket = require("dns-packet");
const dgram = require("node:dgram");
const server = dgram.createSocket("udp4");

/**
 * need to use sudo on linux as it doesnt assign ports below 1024 without sudo
 */

const db = {
  "devgala.facebook.com": {
    data: 'www.facebook.org'
  },
  "devgala.google.com": {
    data: 'www.google.com'
  },
  "devgala.wikipedia.org": {
    data: 'www.wikipedia.org'
  },
  "devgala.whatsapp.com": {
    data: 'www.whatsapp.com'
  },
};
var port = {}
var query_adderss = {}
var questions = {}
server.on("message", (msg, rinfo) => {
  const incomingReq = dnsPacket.decode(msg);
  console.log(incomingReq, rinfo);

  if (incomingReq.questions[0].name.startsWith('devgala.') && incomingReq.type==='query') {

    port[incomingReq.id] = rinfo.port
    questions[incomingReq.id] = JSON.parse(JSON.stringify(incomingReq.questions))
    query_adderss[incomingReq.id] = rinfo.address
    const resolvedName = db[incomingReq.questions[0].name];
    incomingReq.questions[0].name = resolvedName.data
    server.send(dnsPacket.encode(incomingReq), 53, '1.1.1.1', (err, bytes) => console.log('Send Intercept error', bytes, err))
  } else if (incomingReq.type === 'query') {
    questions[incomingReq.id] = incomingReq.questions
    query_adderss[incomingReq.id] = rinfo.address
    port[incomingReq.id] = rinfo.port
    server.send(dnsPacket.encode(incomingReq), 53, '1.1.1.1', (err, bytes) => console.log('Send non-intercept error', bytes, err))
  } else {
    const resp = incomingReq
    resp.questions = questions[incomingReq.id]
    if(resp.answers  && resp.answers.length > 0 && resp.answers[0].name)
    resp.answers[0].name = questions[incomingReq.id][0].name
    server.send(dnsPacket.encode(resp), port[incomingReq.id], query_adderss[incomingReq.id], (err, bytes) => console.log('Send ans error ', bytes, err));
  }





});

server.on('listening', () => {
  const address = server.address();
  console.log(`server listening ${address.address}:${address.port}`);
});

server.on('error', (err) => console.log('Error ', err))
server.bind(53, () => console.log("DNS Server is running on port 53"));