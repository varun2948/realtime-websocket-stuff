const clientsElement = document.querySelector('#clients');
const socket_protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
const socket = new WebSocket(socket_protocol + '://' + window.location.host);

socket.addEventListener('open', () => {
  console.log('COnnected To Server!');
  const name = prompt('What is your Name?');
  socket.send(JSON.stringify({ type: 'setName', data: { name } }));
});
const showClientList = (clients) => {
  clientsElement.textContent = clients.join(', ');
};

socket.addEventListener('message', (event) => {
  try {
    const message = JSON.parse(event.data);
    if (message.type === 'pong') {
      console.log('Message From Server', message);
    } else if (message.type === 'clients') {
      showClientList(message.data);
    }
  } catch (error) {
    console.error(error);
  }
});
