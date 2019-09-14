const shell = require('shelljs');
const fs = require('fs');
const dateFormat = require('dateformat');
const _ = require('lodash')

reps = 3;
// servers = ["192.168.10.21", "192.168.10.22", "192.168.10.23",];
servers = ["10.0.0.11", "10.0.0.12", "10.0.0.13",];
subs = [1, 2, 3]
pubs = [1, 2, 3]
msgs = [1000, 10000]
sizes = [128, 256, 512]

// reps = 2;
// servers = ["10.0.0.11"];
// subs = [1]
// pubs = [1]
// msgs = [1]
// sizes = [1]

topic = "foo";

shell.exec(`rm -rf csv/ && mkdir csv`)

let tests = [];
let testDate = new Date();
let fn = `tests.json`;

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
                subs.forEach(ns => {
                    pubs.forEach(np => {
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

tests.forEach(t => {
    if (!t.Complete) {
        try {
            console.log(`Running ${tests.indexOf(t) + 1}/${tests.length}`)
            let s = t.Input.Server;
            let ns = t.Input.Subscribers;
            let np = t.Input.Publishers;
            let n = t.Input.Messages;
            let ms = t.Input.MessageSize;

            t.Key = `${ns}_${np}_${n}_${ms}`;

            let filename = `csv/REP_${s}_${t.Key}.csv`
            // console.log(`./bench -s ${s} -ns ${ns} -np ${np} -n ${n} -ms ${ms} -csv ${filename} ${topic}`)
            const { stdout, stderr, code } = shell.exec(`./bench -s ${s} -ns ${ns} -np ${np} -n ${n} -ms ${ms} -csv ${filename} ${topic}`)

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
            fs.writeFileSync(fn, JSON.stringify({ tests }));
        } catch (error) {
            console.error(error)
        }
    } else {
        console.info("Skipping complete test");
    }
});

fs.writeFileSync(`results_${dateFormat(testDate, "yyyy-mm-dd'T'HH:MM")}.json`, JSON.stringify({ tests }));

let groupedByKey = _.groupBy(tests, t => {
    return t.Key
})

let stats = []
Object.keys(groupedByKey).forEach(key => {
    let tests = groupedByKey[key];

    stats.push({
        Input: tests[0].Input,
        AverageBytesPerSec: _.meanBy(tests, function (t) {
            return _.meanBy(t.Output, result => {
                return result.BytesPerSec;
            })
        }),
        AverageMsgsPerSec: _.meanBy(tests, function (t) {
            return _.meanBy(t.Output, result => {
                return result.MsgsPerSec;
            })
        }),
    })
});
fs.writeFileSync(`results_${dateFormat(testDate, "yyyy-mm-dd'T'HH:MM")}_grouped.json`, JSON.stringify({ stats }));
