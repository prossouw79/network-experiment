require('custom-env').env('staging')

const kue = require('kue')
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
const _ = require('lodash');
var reInterval = require('reinterval');
const uuidv4 = require('uuid/v4');



var sendFreq = 10;
let jobs = [];
const jobLimit = 300;

var sendMessage = reInterval(function () {
    let a = {
        x: getRandomNumber(0, 100),
        y: getRandomNumber(0, 100),
        z: getRandomNumber(0, 100),
    };
    let b = {
        x: getRandomNumber(0, 100),
        y: getRandomNumber(0, 100),
        z: getRandomNumber(0, 100),
    }

    let d = _getDistanceBetween(a, b);
    // let mt = _moveTo(a, b)
    // let mf = _moveFrom(a, b)
}, sendFreq);

setInterval(() => {
    //remove old jobs
    while (jobs.length > jobLimit)
        jobs.shift();

    let unfinishedJobs = _.filter(jobs, j => {
        return !j.skipped && j.result == null;
    });

    let skippedJobs = _.filter(jobs, j => {
        return j.skipped;
    });

    let receivedJobs = _.filter(jobs, function (i) {
        return !i.skipped && i.received != null;
    });


    let meanProcessingTime = _.meanBy(receivedJobs, function (j) {
        return j.finished - j.started;
    })

    let meanTotalTime = _.meanBy(receivedJobs, function (j) {
        return j.received - j.created;
    });

    let meanWaitingTime = meanTotalTime - meanProcessingTime;

    console.clear();

    let jobsGroupedByWorker = _.groupBy(receivedJobs, j => {
        return j.completedByHostname;
    });


    console.log(`Queue statistics:\n`)
    console.log(`Unfinished jobs: \t ${unfinishedJobs.length}/${jobs.length}`);
    console.log(`Skipped jobs: \t\t ${skippedJobs.length}/${jobs.length}`);

    console.log(`\nMean Job statistics:\n`)
    console.log(`Mean total time: \t ${meanTotalTime.toFixed(1)}ms`);
    console.log(`Mean processing time: \t ${meanProcessingTime.toFixed(1)}ms`);
    console.log(`Mean wait time: \t ${meanWaitingTime.toFixed(1)}ms\n`);

    if (isNaN(meanTotalTime) || (unfinishedJobs.length / jobs.length) > 0.8) {
        sendFreq = 100;
        sendMessage.reschedule(sendFreq);
    }
    if (meanWaitingTime - sendFreq > 30) {
        sendFreq = (2 * sendFreq).toFixed(0);
        console.log(`Decreasing send rate`)
        sendMessage.reschedule(sendFreq);
    } else {
        sendFreq = (0.5 * sendFreq).toFixed(0);
        console.log(`Increasing send rate`)

        sendMessage.reschedule(sendFreq);
    }

    console.log(`\nBroadcast rate: ${sendFreq}ms\n`)

    console.log(`\nWorker performance:\n`)
    _.orderBy(Object.keys(jobsGroupedByWorker), k => {
        return k;
    }).forEach(worker => {
        let jobsByWorker = jobsGroupedByWorker[worker];
        //use key and value here
        console.log(`${worker} : ${((jobsByWorker.length * 100) / receivedJobs.length).toFixed(1)}%`)
    });

}, 100);

function _getDistanceBetween(_a, _b, debug = false) {
    let jobID = uuidv4();

    let newJob = {
        uuid: jobID,
        type: "DistanceBetween",
        created: new Date().getTime(),
        ttl: 1000,
        skipped: false,
        started: null,
        finished: null,
        received: null,
        result: null,
        completedBy: "",
        completedByHostname: "",
        a: _a,
        b: _b
    };
    jobs.push(newJob);


    let job = queue.create('distanceBetween', newJob)
        .removeOnComplete(true)
        .save((err) => {
            if (err) {
                // console.log('INDEX JOB SAVE FAILED');
                console.error(err)
                return;
            }
            job.on('complete', (completedJob) => {
                if (completedJob.skipped) {
                    return null;
                } else {
                    completedJob.received = new Date().getTime();
                    var index = _.findIndex(jobs, { uuid: completedJob.uuid });
                    jobs.splice(index, 1, completedJob);

                    return completedJob.result;
                }

            });
            job.on('failed', (errorMessage) => {
                // console.log('INDEX JOB FAILED');
                console.log(errorMessage);
                return;
            });
        });
}

function _moveTo(_a, _b, debug = false) {
    let t1 = new Date();

    let job = queue.create('moveTo', {
        timestamp: new Date().getTime(),
        ttl: 1000,
        a: _a,
        b: _b
    })
        .removeOnComplete(true)
        .save((err) => {
            if (err) {
                // console.log('INDEX JOB SAVE FAILED');
                console.error(err)
                return;
            }
            job.on('complete', (resp) => {
                let timetaken = Math.abs(new Date().getTime() - t1.getTime());
                updateTimeSheet(timetaken);
                if (debug) {
                    // console.log('INDEX JOB COMPLETE');
                    console.log(`\n${JSON.stringify(_a)} => ${JSON.stringify(resp.result)}`);
                    console.log(`Processed by consumer ${resp.consumer}`);
                    console.log(`Took ${timetaken}ms`);
                }

                return resp.result;
            });
            job.on('failed', (errorMessage) => {
                // console.log('INDEX JOB FAILED');
                console.log(errorMessage);
                return;
            });
        });
}

function _moveFrom(_a, _b, debug = false) {
    let t1 = new Date();

    let job = queue.create('moveFrom', {
        timestamp: new Date().getTime(),
        ttl: 1000,
        a: _a,
        b: _b
    })
        .removeOnComplete(true)
        .save((err) => {
            if (err) {
                // console.log('INDEX JOB SAVE FAILED');
                console.error(err)
                return;
            }
            job.on('complete', (resp) => {
                let timetaken = Math.abs(new Date().getTime() - t1.getTime());
                updateTimeSheet(timetaken);

                if (debug) {
                    // console.log('INDEX JOB COMPLETE');
                    console.log(`\n${JSON.stringify(_a)} => ${JSON.stringify(resp.result)}`);
                    console.log(`Processed by consumer ${resp.consumer}`);
                    console.log(`Took ${timetaken}ms`);
                }

                return resp.result;
            });
            job.on('failed', (errorMessage) => {
                // console.log('INDEX JOB FAILED');
                console.log(errorMessage);
                return;
            });
        });
}



function getRandomNumber(min, max) {
    return Math.floor(Math.random() * max) + min;
}