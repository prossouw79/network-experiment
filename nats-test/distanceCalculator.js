let nats = require('./nats-conf')
let util = require('./util')
let distanceBetween = util.distanceBetween;

let lastKnownPositions = {};


nats.subscribe('positionUpdates', event => {
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
                        x : obj_a.x,
                        y : obj_a.y,
                        z : obj_a.z,
                    },
                    from_id: obj_a.id,
                    to_id: obj_b.id,
                    to_pos: {
                        x : obj_b.x,
                        y : obj_b.y,
                        z : obj_b.z,
                    },
                    distance: d
                }

                lastKnownDistances.push(dto);

                // console.log(`Distance between ${dto.from} and ${dto.to} is ${dto.distance}`);
            }
        });
    });
    // console.log("Sending", lastKnownDistances);
    let message = JSON.stringify(lastKnownDistances);
    nats.publish('distanceUpdates', message)
});

nats.subscribe('deadNodeAlert', event => {
    console.log('Got dead node alert:', event)
    if(lastKnownPositions[event]){
        delete lastKnownPositions[event];
        console.log('Removing', event)
    }
})
