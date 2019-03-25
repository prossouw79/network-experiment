require('custom-env').env('staging')

const _ = require('lodash');
const kue = require('kue');
const cluster = require('cluster');
const uuidv4 = require('uuid/v4');
const consumerID = uuidv4();
var os = require("os");
const workerHostname = os.hostname();

var jobCount = 0;

const queue = kue.createQueue({
    prefix: 'q',
    redis: {
        port: process.env.REDIS_PORT,
        host: process.env.REDIS_IP,
        //   auth: 'password',
        //   db: 3, // if provided select a non-default redis db
        //   options: {
        //     // see https://github.com/mranney/node_redis#rediscreateclient
        //   }
    }
});

var clusterWorkerSize = require('os').cpus().length;

// clusterWorkerSize = 1;

setInterval(() => {
    if (jobCount > 0) {
        console.clear()
        console.log(`${jobCount}`);
        jobCount = 0;
    }
}, 1000);

function setJobMeta(job) {
    job.data.finished = new Date().getTime();
    job.data.completedBy = consumerID;
    job.data.completedByHostname = workerHostname;

    jobCount++;
}


if (cluster.isMaster) {
    console.log(`Consumer starting with ${clusterWorkerSize} threads.`)
    kue.app.listen(3000);
    for (var i = 0; i < clusterWorkerSize; i++) {
        console.log(`Starting thread ${i}/${clusterWorkerSize}`)
        cluster.fork();
    }
} else {
    queue.process('distanceBetween', async function (job, done) {
        console.log(`Processing ${job.data.uuid}`)

        job.data.started = new Date().getTime();
        if (job.data.started - job.data.created > job.data.ttl) {
            job.data.skipped = true;
        } else {
            job.data.result = distanceBetween(job.data.a, job.data.b);
            setJobMeta(job);
        }
        done(null, job.data);
    });

    queue.process('moveTo', async function (job, done) {

        console.log(`Processing ${job.data.uuid}`)

        job.data.started = new Date().getTime();
        if (job.data.started - job.data.created > job.data.ttl) {
            job.data.skipped = true;
        } else {
            job.data.result = moveTo(job.data.a, job.data.b);
            setJobMeta(job);
        }

        done(null, job.data);
    });

    queue.process('moveFrom', async function (job, done) {

        console.log(`Processing ${job.data.uuid}`)

        job.data.started = new Date().getTime();
        if (job.data.started - job.data.created > job.data.ttl) {
            job.data.skipped = true;
        } else {
            job.data.result = moveFrom(job.data.a, job.data.b);
            setJobMeta(job);
        }

        done(null, job.data);
    });
}

function distanceBetween(a, b) {
    var xD = Math.pow(a.x - b.x, 2);
    var yD = Math.pow(a.y - b.y, 2);
    var zD = Math.pow(a.z - b.z, 2);

    return Math.sqrt(xD + yD + zD);
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