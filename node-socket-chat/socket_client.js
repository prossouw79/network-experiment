var io = require('socket.io-client');
var socket = io.connect('http://localhost:3000', {
    reconnect: true
});

function guid() {
    function s4() {
        return Math.floor((1 + Math.random()) * 0x10000)
            .toString(16)
            .substring(1);
    }
    return s4() + "-" + s4();
}

var lastUpdate = new Date();
var updateHistory = [];

function distanceBetween(a, b) {
    var xD = Math.pow(a.X - b.X, 2);
    var yD = Math.pow(a.Y - b.Y, 2);
    var zD = Math.pow(a.Z - b.Z, 2);

    return Math.round(Math.sqrt(xD + yD + zD));
}

var currentPosition = {
    "X": 0,
    "Y": 0,
    "Z": 0,
    "DistanceMoved": 0,
    "AverageSpeed": 0,
    "TimeStamp": new Date()
}

function RandomIntBetween(min, max) {
    return Math.floor(Math.random() * max) + min;
}

var positionSequence = 0;

function newPosition() {
    var copyPosition = JSON.parse(JSON.stringify(currentPosition));

    var limit = 2;

    currentPosition.X += RandomIntBetween(-3, 3);
    currentPosition.Y += RandomIntBetween(-3, 3);
    currentPosition.Z += RandomIntBetween(-3, 3);
    currentPosition.DistanceMoved = distanceBetween(copyPosition, currentPosition);
    currentPosition.AverageSpeed = 0;
    currentPosition.TimeStamp = new Date();
    currentPosition.positionSequence = positionSequence++;
    currentPosition.Color = 0;

    updateHistory.push(currentPosition);

    updateHistory.sort(function (a, b) {
        if (a.positionSequence < b.positionSequence)
            return -1;
        if (a.positionSequence > b.positionSequence)
            return 1;
        return 0;
    });


    if (updateHistory.length > limit) {
        updateHistory = updateHistory.slice(updateHistory.length - limit, limit);
        console.log(updateHistory);
    }

    var timeDif = (updateHistory[updateHistory.length - 1].TimeStamp - updateHistory[0].TimeStamp) / 1000; //time in seconds
    var distanceTravelled = 0;

    updateHistory.forEach(c => {
        distanceTravelled += c.DistanceMoved;
    });

    //currentPosition.AverageSpeed = distanceTravelled/timeDif;

    var updateMessage = {
        "message": JSON.stringify(currentPosition),
        "from": myID
    }

    socket.emit('transmission', updateMessage);
}

var myID = guid();


//periodically refresh position
setInterval(function () {
    newPosition();
}, 1000);



// Add a connect listener
socket.on('connect', function (socket) {
    console.log('Connected!');
});
var testMessage = {
    "timestamp": new Date(),
    "message": "Hi, I'm a bot",
    "from": myID
}

socket.emit('transmission', testMessage);