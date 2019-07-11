let util = require('./util')
let _ = require('lodash')
asTable = require('as-table')
let distanceBetween = util.distanceBetween;

let getNats = require('./randomNats.js');
let nats = getNats();
let printState = {};
setInterval(() => {
    nats = getNats();
    printState.Server = nats.currentServer.url.host;
}, 500);

let lastKnownPositions = {};


nats.subscribe(util.getEnvironmentVariable('TOPIC_POSITION'), event => {
    let e = JSON.parse(event);

    if (!lastKnownPositions[e.id]) {
        lastKnownPositions[e.id] = {};
    }
    lastKnownPositions[e.id] = e;
    let lastKnownDistances = [];
    Object.keys(lastKnownPositions).forEach(a => {
        Object.keys(lastKnownPositions).forEach(b => {
            if (a != b) {
                let obj_a = lastKnownPositions[a];
                let obj_b = lastKnownPositions[b];

                let d = distanceBetween(obj_a, obj_b).toFixed(3);

                let dto = {
                    from_pos: {
                        x: obj_a.x,
                        y: obj_a.y,
                        z: obj_a.z,
                    },
                    from_id: obj_a.id,
                    to_id: obj_b.id,
                    to_pos: {
                        x: obj_b.x,
                        y: obj_b.y,
                        z: obj_b.z,
                    },
                    distance: d
                }

                lastKnownDistances.push(dto);
            }
        });
    });

    let headers = ['Distance', 'Node A', 'Node B'];
    let printTable = _.orderBy(lastKnownDistances, x => parseInt(x.distance));
    printTable = _.uniqBy(printTable, x => x.distance);
    printTable = _.map(printTable,summary =>  [summary.distance, summary.from_id, summary.to_id]);
    printTable.splice(0,0,headers);

    console.clear();
    console.info(asTable(printTable));
    console.info(printState)


    let message = JSON.stringify(lastKnownDistances);
    nats.publish(util.getEnvironmentVariable('TOPIC_DISTANCE'), message)
});

nats.subscribe(util.getEnvironmentVariable('TOPIC_DEAD_NODE'), event => {
    printState.Received = `Got dead node alert:' ${event}`;
    if (lastKnownPositions[event]) {
        delete lastKnownPositions[event];
        printState.Action = `Removing: ${event}`;
    }
})
