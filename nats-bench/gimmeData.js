const shell = require('shelljs');
const fs = require('fs');
const dateFormat = require('dateformat');
const _ = require('lodash')
const ObjectsToCsv = require('objects-to-csv');

reps = 5;
servers = ["10.0.0.11", "10.0.0.12", "10.0.0.13"];
// servers = ["nats-cluster-node-1", "nats-cluster-node-2", "nats-cluster-node-3"];
pubs = [1, 2, 3];
subs = [0, 1, 2, 3];
msgs = [500]
sizes = [1, 2, 4, 8, 16, 32, 64, 128]

topic = "foo";

shell.exec(`rm -rf csv/ && mkdir csv`)

let tests = [];
let testDate = new Date();
let fn = `tests.json`;


function msConversion(millis) {
    let sec = Math.floor(millis / 1000);
    let hrs = Math.floor(sec / 3600);
    sec -= hrs * 3600;
    let min = Math.floor(sec / 60);
    sec -= min * 60;
  
    sec = '' + sec;
    sec = ('00' + sec).substring(sec.length);
  
    if (hrs > 0) {
      min = '' + min;
      min = ('00' + min).substring(min.length);
      return hrs + ":" + min + ":" + sec;
    }
    else {
      return min + ":" + sec;
    }
  }

if (fs.existsSync(fn)) {
    existingTests = JSON.parse(fs.readFileSync(fn, "utf8"));
    let incompleteTests = existingTests.tests.filter(x => x.Complete == false);
    if (incompleteTests.length > 0)
        tests = existingTests.tests;
}

if (tests.length == 0) {
    msgs.forEach(n => {
        sizes.forEach(ms => {
            servers.forEach(s => {
                pubs.forEach(np => {
                    subs.forEach(ns => {
                        for (let i = 0; i < reps; i++) {
                            tests.push({
                                Complete: false,
                                Key: '',
                                Input: {
                                    Server: s,
                                    Subscribers: ns,
                                    Publishers: np,
                                    Messages: n,
                                    MessageSize: ms,
                                },
                                Output: []
                            })
                        }
                    });
                });
            });
        });
    });
}

let totalDataToSend = _.sumBy(tests, t => {
    return t.Complete ? 0 : t.Input.Messages * t.Input.MessageSize;
})
let dataSent = 0;

let startTime = new Date();

tests = _.sortBy(tests, i => {
    return -1 * i.Input.Messages * i.Input.MessageSize
})

tests.forEach(t => {
    if (!t.Complete) {
        try {
            let elapsedTime = (new Date().getTime() - startTime.getTime());
            let percentageDone = (dataSent * 100 / totalDataToSend).toFixed(2);
            let totalEstimatedTime = (elapsedTime * totalDataToSend / dataSent);
            let remainingTime = (totalEstimatedTime - elapsedTime);

            // console.log(`Running ${tests.indexOf(t) + 1}/${tests.length}`);
            console.clear();
            console.log(`Sent ${dataSent.toFixed(0)/1000} / ${totalDataToSend / 1000} bytes:\t${percentageDone}% \nEst. time remaining:\t${msConversion(remainingTime)}`);
            console.log()
            let s = t.Input.Server;
            let ns = t.Input.Subscribers;
            let np = t.Input.Publishers;
            let n = t.Input.Messages;
            let ms = t.Input.MessageSize;

            t.Key = `${ns}_${np}_${n}_${ms}`;

            let filename = `csv/REP_${s}_${t.Key}.csv`
            // console.log(`./bench -s ${s} -ns ${ns} -np ${np} -n ${n} -ms ${ms} -csv ${filename} ${topic}`)
            const { stdout, stderr, code } = shell.exec(`./bench -s ${s} -ns ${ns} -np ${np} -n ${n} -ms ${ms} -csv ${filename} ${topic}`, {silent:true})

            let csvStr = fs.readFileSync(filename, "utf8");
            let lines = csvStr.split(/\r?\n/)
                .filter(l => l.length > 0)
                .filter(l => !l.startsWith('#'))

            lines.forEach(l => {
                let parts = l.split(',');
                t.Output.push({
                    MsgBytes: parseInt(parts[3]),
                    MsgsPerSec: parseInt(parts[4]),
                    BytesPerSec: parseFloat(parts[5]),
                    DurationSecs: parseFloat(parts[6])
                });
            });

            t.Complete = true;
            dataSent += (t.Input.MessageSize * t.Input.Messages);
            fs.writeFileSync(fn, JSON.stringify({ tests }));
        } catch (error) {
            console.error(error)
        }
    } else {
        console.info("Skipping complete test");
    }
});

fs.writeFileSync(`results_${dateFormat(testDate, "yyyy-mm-dd'T'HH:MM")}.json`, JSON.stringify({ tests }));

let stats = []

let groupedByServer = _.groupBy(tests, t => {
    return t.Input.Server;
})

console.log(groupedByServer)

Object.keys(groupedByServer).forEach(server => {
    let serverTests = groupedByServer[server];

    let groupedByInputKey = _.groupBy(serverTests, x => x.Key)
    console.log(groupedByInputKey)

    Object.keys(groupedByInputKey).forEach(groupKey => {
        let group = groupedByInputKey[groupKey]
        console.log(group);

        stats.push(
            {
                Server: group[0].Input.Server,
                MessageSize: group[0].Input.MessageSize,
                Messages: group[0].Input.Messages,
                AverageBytesPerSec: _.meanBy(group, function (t) {
                    return _.meanBy(t.Output, result => {
                        return result.BytesPerSec;
                    })
                }),
                AverageMsgsPerSec: _.meanBy(group, function (t) {
                    return _.meanBy(t.Output, result => {
                        return result.MsgsPerSec;
                    })
                }),
            }
        )
    });
});
console.log(stats)
new ObjectsToCsv(stats).toDisk(`results_${dateFormat(testDate, "yyyy-mm-dd'T'HH:MM")}.csv`);

fs.writeFileSync(`results_${dateFormat(testDate, "yyyy-mm-dd'T'HH:MM")}_grouped.json`, JSON.stringify({ stats }));
