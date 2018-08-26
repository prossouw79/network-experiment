var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);

var port = 3000;

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