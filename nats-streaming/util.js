require('dotenv').config()

function getDefaultSTAN(prefix){
    return require('node-nats-streaming')
    .connect(getEnvironmentVariable('CLUSTER_ID'),
     `${prefix}-${guid()}`,
     {
         maxReconnectAttempts: 3,
         verbose: true,
         url: `nats://${getEnvironmentVariable('NATS_SERVER')}:4222`,
        //  servers: `nats://${getEnvironmentVariable('NATS_STREAMING_SERVER')}:4222`,
         reconnect: true,
     });
}

function getEnvironmentVariable(key) {
    return process.env[key];
}

function printCurrentState(printState) {
    console.clear();

    Object.keys(printState)
        .sort()
        .filter(x => x != "Table")
        .forEach(k => {
            let v = printState[k];
            if(typeof v === 'object'){
                console.info(k+":\t",v);
            }else{
                console.info(`${k}:\t${v}`);
            }
        });
        if(printState["Table"])
    console.log(printState.Table);

}

function randBetween(minimum, maximum) {
    let rnd = Math.floor(Math.random() * (maximum - minimum + 1)) + minimum;
    return rnd
}

function distanceBetween(a, b) {
    let dx = a.x - b.x;
    let dy = a.y - b.y;
    let dz = a.z - b.z;

    return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

function moveTo(origin, target, maxDistance = 2) {
    var xDif = origin.x - target.x;
    var yDif = origin.y - target.y;
    var zDif = origin.z - target.z;

    if (xDif > 0) {
        origin.x = origin.x - maxDistance;
    } else {
        origin.x = origin.x + maxDistance;
    }

    if (yDif > 0) {
        origin.y = origin.y - maxDistance;
    } else {
        origin.y = origin.y + maxDistance;
    }

    if (zDif > 0) {
        origin.z = origin.z - maxDistance;
    } else {
        origin.z = origin.z + maxDistance;
    }
}

function moveFrom(origin, target, maxDistance = 2) {
    var xDif = origin.x - target.x;
    var yDif = origin.y - target.y;
    var zDif = origin.z - target.z;

    if (xDif < 0) {
        origin.x = origin.x - maxDistance;
    } else {
        origin.x = origin.x + maxDistance;
    }

    if (yDif < 0) {
        origin.y = origin.y - maxDistance;
    } else {
        origin.y = origin.y + maxDistance;
    }

    if (zDif < 0) {
        origin.z = origin.z - maxDistance;
    } else {
        origin.z = origin.z + maxDistance;
    }
}

function guid(parts = 1) {
    function s4() {
        return Math.floor((1 + Math.random()) * 0x10000)
            .toString(16)
            .substring(1);
    }
    let guid = "";
    for (let c = 0; c < parts; c++) {
        guid += s4() + "-";
    }

    guid = guid.substring(0, guid.length - 1);

    return guid;
}

module.exports = {
    randBetween: randBetween,
    distanceBetween: distanceBetween,
    moveFrom: moveFrom,
    moveTo: moveTo,
    printCurrentState: printCurrentState,
    getEnvironmentVariable: getEnvironmentVariable,
    guid: guid,
    getDefaultSTAN: getDefaultSTAN
}