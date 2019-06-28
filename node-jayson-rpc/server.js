'use strict';

const jayson = require('jayson/promise');
require('lodash.combinations');
const _ = require('lodash');

let _guid = require('./util/guid.js');
let _distanceBetween = require('./util/distance.js');
let _averageSpeed = require('./util/averageSpeed.js')
let _moveRandom = require('./util/moveRandom.js');
let _moveTo = require('./util/moveTo.js')
let _moveFrom = require('./util/moveFrom.js')

let knownPositions = {};

//periodically trim nodes that haven't sent an update
let staleMS = 5000;
setInterval(() => {
    if (Object.keys(knownPositions).length > 0) {
        let now = new Date().getTime();
        let keysToDelete = Object.keys(knownPositions)
            .filter(key => {
                if ((now - knownPositions[key].lastUpdate) > staleMS) {
                    return key
                }
            })

        if (keysToDelete.length > 0) {
            keysToDelete.forEach(key => {
                delete knownPositions[key];
            });
            console.log(`Trimming node list due to inactivity:`, keysToDelete)
        }
    }
}, 500);

// create a server
const server = jayson.server({
    guid: function (args) {
        return new Promise(function (resolve, reject) {
            let result = _guid(args[0]);
            resolve(result);
        });
    },
    positionUpdate: function (args) {
        return new Promise(function (resolve, reject) {
            args[0].lastUpdate = new Date().getTime();
            knownPositions[args[0].NodeID] = args[0];
            resolve(knownPositions);
        });
    },
    distanceBetween: function (args) {
        return new Promise(function (resolve, reject) {
            let d = _distanceBetween(args[0], args[1], args[2]);
            let result = {
                a: args[0].NodeID,
                b: args[1].NodeID,
                distance: d
            }
            resolve(result);
        });
    },
    averageSpeed: function (args) {
        return new Promise(function (resolve, reject) {
            let result = _averageSpeed(args[0], args[1]);
            resolve(result);
        });
    },
    moveRandom: function (args) {
        return new Promise(function (resolve, reject) {
            let result = _moveRandom(args[0], args[1]);
            resolve(result);
        });
    },
    moveTo: function (args) {
        return new Promise(function (resolve, reject) {
            let result = _moveTo(args[0], args[1], args[2]);
            resolve(result);
        });
    },
    moveFrom: function (args) {
        return new Promise(function (resolve, reject) {
            let result = _moveFrom(args[0], args[1], args[2]);
            resolve(result);
        });
    }
});

server.http().listen(3000);