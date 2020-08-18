const http = require('http');
const path = require('path');
const WebSocket = require('ws');
const express = require('express');

const app = express();
const server = http.createServer(app);

app.use(express.static(path.join(__dirname, '..', 'client')));
let clients = [];
const uniqueClients = new Set();
const getClientNames = () => clients.map(({ name }) => name);
app.get('/clients', (req, res) => {
  res.json(getClientNames());
});

const wss = new WebSocket.Server({ server });

wss.on('connection', (ws, req) => {
  let ip = req.socket.remoteAddress;
  try {
    // eslint-disable-next-line prefer-destructuring
    ip = req.headers['x-forwarded-for'].split(/\s*,\s*/)[0];
  } catch (error) {
    console.error(error);
  }
  if (uniqueClients.has(ip)) {
    return ws.close();
  }
  uniqueClients.add(ip);
  const clientInfo = { ws, name: 'anonymous' };
  clients.push(clientInfo);
  console.log('CLient Connected!');
  ws.send(JSON.stringify({ type: 'clients', data: getClientNames() }));
  ws.on('message', (message) => {
    try {
      const messageObj = JSON.parse(message);
      console.log(messageObj);
      if (messageObj.type === 'ping') {
        ws.send(JSON.stringify({ type: 'pong' }));
      } else if (messageObj.type === 'setName') {
        clientInfo.name = messageObj.data.name;
        wss.clients.forEach((client) => {
          if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({ type: 'clients', data: getClientNames() }));
          }
        });
      }
    } catch (error) {
      console.error(error);
    }
  });
  ws.on('close', () => {
    uniqueClients.delete(ip);
    clients = clients.filter((client) => client.ws !== ws);
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({ type: 'clients', data: getClientNames() }));
      }
    });
  });
});
const port = process.env.PORT || 4242;
server.listen(port);
