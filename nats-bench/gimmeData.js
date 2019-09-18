const shell = require("shelljs");
const fs = require("fs");
const dateFormat = require("dateformat");
const _ = require("lodash");
const ObjectsToCsv = require("objects-to-csv");

let testDate = new Date();
let results_folder = `results/${dateFormat(testDate, "yyyy-mm-dd'T'HH:MM")}`;
shell.exec(`mkdir -p ${results_folder}`);
let fn = `${results_folder}/tests.json`;

reps = 3;
servers = ["10.0.0.11", "10.0.0.12", "10.0.0.13"];
// servers = ["nats-cluster-node-1", "nats-cluster-node-2", "nats-cluster-node-3"];
pubs = [1, 2];
subs = [0, 1, 2];
msgs = 1000;
sizes = [1, 2, 4, 8, 16, 32, 64, 128];

// test params
// reps = 2;
// servers = ["10.0.0.11", "10.0.0.12"];
// // servers = ["nats-cluster-node-1", "nats-cluster-node-2", "nats-cluster-node-3"];
// pubs = [1, 2];
// subs = [0, 1];
// msgs = 10;
// sizes = [1, 2];

topic = "foo";

shell.exec(`rm -rf csv/ && mkdir csv`);

let tests = [];

if (fs.existsSync(fn)) {
  existingTests = JSON.parse(fs.readFileSync(fn, "utf8"));
  let incompleteTests = existingTests.tests.filter(x => x.Complete == false);
  if (incompleteTests.length > 0) tests = existingTests.tests;
}

if (tests.length == 0) {
  sizes.forEach(ms => {
    servers.forEach(s => {
      pubs.forEach(np => {
        subs.forEach(ns => {
          for (let i = 0; i < reps; i++) {
            tests.push({
              Complete: false,
              Repetition: (i+1),
              Server: s,
              Subscribers: ns,
              Publishers: np,
              MessageSize: ms,
              Messages: msgs,
              PublisherAverageMsgsPerSec: 0,
              SubscriberAverageMsgsPerSec: 0,
              PublisherAverageBytesPerSec: 0,
              SubscriberAverageBytesPerSec: 0
            });
          }
        });
      });
    });
  });
}

tests.forEach(t => {
  if (!t.Complete) {
    try {
      console.clear();
      console.log(`Running ${tests.indexOf(t) + 1}/${tests.length}`);

      let filename = `csv/REP_${t.Server}_${t.Key}.csv`;
      const { stdout, stderr, code } = shell.exec(
        `./bench -s ${t.Server} -ns ${t.Subscribers} -np ${t.Publishers} -n ${t.Messages} -ms ${t.MessageSize} -csv ${filename} ${topic}`,
        { silent: false }
      );

      let csvStr = fs.readFileSync(filename, "utf8");
      //example
      // 0                        1         2         3         4           5              6  
      // #RunID,                  ClientID, MsgCount, MsgBytes, MsgsPerSec, BytesPerSec,   DurationSecs
      // hojfy5lmijWfvGV7lsw8dK,  S0,       1000,     4000,     13981,      55926.401192,  0.071523
      // hojfy5lmijWfvGV7lsw8dK,  S1,       1000,     4000,     13495,      53980.487403,  0.074101
      // hojfy5lmijWfvGV7lsw8dK,  S2,       1000,     4000,     13530,      54120.800360,  0.073909
      // hojfy5lmijWfvGV7lsw8dK,  P0,       334,      1336,     13332,      53331.564131,  0.025051
      // hojfy5lmijWfvGV7lsw8dK,  P1,       333,      1332,     23300,      93201.137922,  0.014292
      // hojfy5lmijWfvGV7lsw8dK,  P2,       333,      1332,     21431,      85727.299273,  0.015538

      let lines = csvStr
        .split(/\r?\n/)
        .filter(l => l.length > 0)
        .filter(l => !l.startsWith("#"));

      let subResults = lines.filter(x => x.split(",")[1].startsWith("S"));
      let pubResults = lines.filter(x => x.split(",")[1].startsWith("P"));

      t.PublisherAverageMsgsPerSec = _.meanBy(pubResults, x => parseInt(x.split(',')[4]) )
      t.SubscriberAverageMsgsPerSec = _.meanBy(subResults, x => parseInt(x.split(',')[4]) )
      t.PublisherAverageBytesPerSec = _.meanBy(pubResults, x => parseFloat(x.split(',')[5]) )
      t.SubscriberAverageBytesPerSec = _.meanBy(subResults, x => parseFloat(x.split(',')[5]) )

      t.Complete = true;
      fs.writeFileSync(fn, JSON.stringify({ tests }));
    } catch (error) {
      console.error(error);
    }
  } else {
    console.info("Skipping complete test");
  }
});

fs.writeFileSync(
  `${results_folder}/${dateFormat(testDate, "yyyy-mm-dd'T'HH:MM")}.json`,
  JSON.stringify({ tests })
);

new ObjectsToCsv(tests).toDisk(
  `${results_folder}/${dateFormat(testDate, "yyyy-mm-dd'T'HH:MM")}.csv`
);

// //flatten results
// let flatResults = [];
//   sizes.forEach(ms => {
//     servers.forEach(s => {
//       pubs.forEach(np => {
//         subs.forEach(ns => {
//           let filteredResults = _.filter(tests, t => )
//         });
//       });
//     });
//   });

// sizes.forEach(ms => {
//   pubs.forEach(np => {
//     subs.forEach(ns => {
//       let arr = [];
//       let filename = `${results_folder}/${ms}-${np}-${ns}.csv`;
//       let groupedResult = _.filter(tests, function(t) {
//         return (
//           t.Output.Subs == ns && t.Output.Pubs == np && t.Output.MsgBytes == ms
//         );
//       });
//       Object.keys(groupedResult).forEach(k => {
//         arr.push(groupedResult[k]);
//       });

//       shell.exec(`touch ${filename}`);
//       new ObjectsToCsv(_.sortBy(arr, l => l.Client)).toDisk(filename);
//     });
//   });
// });
