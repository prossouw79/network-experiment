const queue = require('./queue/kueconnection');
const uuidv4 = require('uuid/v4');
const consumerID = uuidv4();

//functions
const moveTo = require('./droneOperations/moveTo');
const moveFrom = require('./droneOperations/moveFrom');
const distanceBetween = require('./droneOperations/distanceBetween');
const averageSpeed = require('./droneOperations/averageSpeed')

console.log('WORKER CONNECTED');

queue.process('distanceBetween', async function (job, done) {
    let now = new Date().getTime();

    if (!job.data.a || !job.data.b) {
        done(null, 'unknown');
    } else if ((now - job.timestamp) > job.ttl) {
        done(null, 'old')
    } else {
        let distance = distanceBetween(job.data.a, job.data.b);
        done(null, {
            result: distance,
            consumer: consumerID
        });
    }
});

queue.process('moveTo', async function (job, done) {
    let now = new Date().getTime();

    if (!job.data.a || !job.data.b) {
        done(null, 'unknown');
    } else if ((now - job.timestamp) > job.ttl) {
        done(null, 'old')
    } else {
        moveTo(job.data.a, job.data.b);
        done(null, {
            result: job.data.a,
            consumer: consumerID
        });
    }
});

queue.process('moveFrom', async function (job, done) {
    let now = new Date().getTime();

    if (!job.data.a || !job.data.b) {
        done(null, 'unknown');
    } else if ((now - job.timestamp) > job.ttl) {
        done(null, 'old')
    } else {
        moveFrom(job.data.a, job.data.b);
        done(null, {
            result: job.data.a,
            consumer: consumerID
        });
    }
});


