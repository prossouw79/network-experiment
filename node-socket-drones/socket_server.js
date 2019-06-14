let app = require('express')();
let http = require('http').Server(app);
let io = require('socket.io')(http);

let port = 7000;

app.get('/', function (req, res) {
  res.sendFile(__dirname + '/visualizer.html');
});

io.on('connection', function (socket) {
  socket.on('disconnect', function () {
    console.log('user disconnected');
  });
  socket.on('transmission', function (msg) {
    //console.log('Received ', msg);
    io.emit('transmission', msg);
  });
});

http.listen(port, function () {
  console.log('Listening on port ' + port);
});