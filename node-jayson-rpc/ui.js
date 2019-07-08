let app = require('express')();
let http = require('http').Server(app);


let port = 8080;

app.get('/', function (req, res) {
    res.sendFile(__dirname + '/visualizer.html');
}); 

http.listen(port, function () {
    console.log('Listening on port ' + port);
});