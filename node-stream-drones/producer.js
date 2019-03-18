const queue = require('./queue/kueconnection');

setInterval(() => {
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

    let d = _getDistanceBetween(a, b,true);
    let mt = _moveTo(a, b, true)
    let mf = _moveFrom(a, b, true)

}, 500);

function _getDistanceBetween(_a, _b, debug = false) {
    let t1 = new Date();

    let job = queue.create('distanceBetween', {
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

                if (debug) {
                    // console.log('INDEX JOB COMPLETE');
                    console.log(`\nDistance between A and B is ${resp.result}`);
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