'use strict';


const _ = require('lodash')
const os = require('os')
const jayson = require('jayson/promise');

let nodes = ['localhost', '127.0.0.1', os.hostname()]
let port = 3000;

let clients = nodes.map(node => jayson.client.http(`http://${node}:${port++}`));

let clientIndex = 0;
let roundRobinClient = function () {
    let nextClient = clients[clientIndex];

    clientIndex = clientIndex == (clients.length - 1) ? 0 : (clientIndex + 1);
    return nextClient;
}


let mapErrorCode = require('./util/mapErrorCode')

let nodeID = null;
let localState = null;
let knownPositions = {};
let minDistance = 3;
let maxDistance = 8;
let maxSpeed = 3;

const tickrate = 500;

roundRobinClient().request('guid', [3]).then(resp => {
    nodeID = resp.result;
    console.log(nodeID)
    localState = {
        "NodeID": nodeID,
        "x": 0,
        "y": 0,
        "z": 0,
        "AverageSpeed": 0,
        "DistanceTo": {}
    }
}, err => {
    console.error(err);
    process.exit(1);
})

//position broadcast with response
setInterval(() => {
    console.info('BC_POS')
    if (localState && localState.NodeID) {
        roundRobinClient().request('positionUpdate', [localState])
            .then(resp => {
                knownPositions = resp.result;
            }, err => {
                console.error(err);
            })
    }
}, tickrate);

//move random
setInterval(() => {
    console.info('MV_RND')
    let randomMoveRequest = roundRobinClient().request('moveRandom', [3, localState]);
    randomMoveRequest.then(resp => {
        if (resp.error)
            console.error("JSON RPC ERROR:", mapErrorCode(resp.error.code))
        if (resp.result) {
            localState = resp.result;
        }
    })
}, tickrate);

setInterval(() => {
    console.info('GT_DST')
    if (!localState || !knownPositions || Object.keys(knownPositions).length < 2)
        return;
    let otherNodes = _.filter(Object.keys(knownPositions), x => x != localState.NodeID);
    let distanceRequests = [];
    otherNodes.forEach(nodeID => {
        if (knownPositions[nodeID] && knownPositions[nodeID].NodeID != localState.NodeID) {
            distanceRequests.push(roundRobinClient().request('distanceBetween',
                [
                    localState,
                    knownPositions[nodeID]
                ]))
        }
    });

    Promise.all(distanceRequests).then(function (responses) {
        responses.forEach(r => {
            if (r.result) {
                localState.DistanceTo[r.result.b] = +r.result.distance
            }
        });
    });
}, tickrate);


setInterval(() => {
    console.info('GT_DST')

    if (Object.keys(localState.DistanceTo).length == 0)
        return;

    let nodesByDistance = Object.keys(localState.DistanceTo)
        .filter(x => x.NodeID != localState.NodeID)
        .sort((a, b) => (a > b) ? 1 : -1)
        .map(x => {
            return {
                NodeID: x,
                Distance: localState.DistanceTo[x]
            }
        })
    let closestNode = nodesByDistance[0];
    let farthestNode = nodesByDistance[nodesByDistance.length - 1]

    if (closestNode.Distance < minDistance) {
        console.info(localState.NodeID, ' < -- <', farthestNode.NodeID)
        roundRobinClient().request('moveFrom', [localState, knownPositions[closestNode.NodeID], maxSpeed])
            .then(response => {
                if (response.result) {
                    localState = response.result;
                } else {
                    console.error(mapErrorCode(response.error.code))
                }
            })
    }
    if (farthestNode.Distance > maxDistance) {
        console.info(localState.NodeID, ' > -- > ', farthestNode.NodeID)
        roundRobinClient().request('moveTo', [localState, knownPositions[farthestNode.NodeID], maxSpeed])
            .then(response => {
                if (response.result) {
                    localState = response.result;
                } else {
                    console.error(mapErrorCode(response.error.code))
                }
            })
    }
}, tickrate);





// //#region guid
// let guidPromise = roundRobinClient().request('guid', [3]);

// guidPromise.then(resp => {
//     console.log('guid', resp.result);
// }, err => {
//     console.error(err);
// })
// //#endregion

//#region distanceTest
// let testA = {
//     x: 3,
//     y: 2,
//     z: 5
// }

// let testB = {
//     x: 7,
//     y: 4,
//     z: 1
// }

// let distancePromise = roundRobinClient().request('distanceBetween', [testA, testB, 3]);
// distancePromise.then(resp => {
//     console.log(`Distance between A and B is:`, resp.result);
// }, err => {
//     console.error(err);
// })
//#endregion

// //#region averageSpeed
// let updateHistory = [{
//     DistanceMoved: 3
// }, {
//     DistanceMoved: 4
// }, {
//     DistanceMoved: 2
// }, {
//     DistanceMoved: 2
// }, {
//     DistanceMoved: 7
// }]

// let positionUpdateRate = 1000;

// let avgSpeedPromise = roundRobinClient().request('averageSpeed', [updateHistory, positionUpdateRate]);
// avgSpeedPromise.then(resp => {
//     console.log(`Average speed is:`, resp.result);
// }, err => {
//     console.error(err);
// });
// //#endregion

// //#region moveRandom
// let maxSpeed = 3;
// let currentPosition = {
//     x: 0,
//     y: 0,
//     z: 0
// }
// let moveRandomPromise = roundRobinClient().request('moveRandom', [maxSpeed, currentPosition]);

// moveRandomPromise.then(resp => {
//     console.log('Position after random move', resp.result);
// }, err => {
//     console.error(err);
// })
// //#endregion

// //#region moveTo
// let targetPosition = {
//     x: 5,
//     y: 5,
//     z: 5
// }
// let moveToPromise = roundRobinClient().request('moveTo', [currentPosition, targetPosition, maxSpeed]);

// moveToPromise.then(resp => {
//     console.log('Position after move to ', targetPosition, ' is ', resp.result);
// }, err => {
//     console.error(err);
// })
// //#endregion

// //#region moveFrom
// let moveFromPromise = roundRobinClient().request('moveFrom', [currentPosition, targetPosition, maxSpeed]);

// moveFromPromise.then(resp => {
//     console.log('Position after move from ', targetPosition, ' is ', resp.result);
// }, err => {
//     console.error(err);
// })
// //#endregion

