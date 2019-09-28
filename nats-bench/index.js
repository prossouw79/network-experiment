const shell = require("shelljs");
const fs = require("fs");
const dateFormat = require("dateformat");
const _ = require("lodash");
const ObjectsToCsv = require("objects-to-csv");
const os = require('os');

let testDate = new Date();
let results_folder = `results/${dateFormat(testDate, "yyyy-mm-dd'T'HH:MM")}`;
shell.exec(`mkdir -p ${results_folder}`);
let fn = `results/current_tests.json`;

reps = 3;
// servers = ["localhost", "127.0.0.1", os.hostname()];                                  //local-script-mode
servers = ["10.0.0.11", "10.0.0.12", "10.0.0.13"];                                 //mesh-node
// servers = ["192.168.10.21","192.168.10.22","192.168.10.23"];                       //eth-node
// servers = ["nats-cluster-node-1", "nats-cluster-node-2", "nats-cluster-node-3"];   //swarm-container
pubs = [1, 2];
subs = [0, 1, 2];

const expMin = 0;
const expMax = 12; //e.g. 10 => 1024
const base = 100; //messages sent of the largest size

sizes = [];
for (let exp = expMax; exp >= expMin ; exp--) {
  sizes.push(Math.pow(2,exp));  
}
let testSize = sizes[0] * base;
msgs = sizes.map(x => testSize/x);

console.log('Input Vector:',sizes,msgs)

function msConversion(millis) {
  let sec = Math.floor(millis / 1000);
  let hrs = Math.floor(sec / 3600);
  sec -= hrs * 3600;
  let min = Math.floor(sec / 60);
  sec -= min * 60;

  sec = "" + sec;
  sec = ("00" + sec).substring(sec.length);

  if (hrs > 0) {
    min = "" + min;
    min = ("00" + min).substring(min.length);
    return hrs + ":" + min + ":" + sec;
  } else {
    return min + ":" + sec;
  }
}

function mean(data) {
  return data.reduce(function (a, b) {
      return Number(a) + Number(b);
  }) / data.length;
};

function standardDeviation (data) {
  return Math.sqrt(data.reduce(function (sq, n) {
          return sq + Math.pow(n - mean(data), 2);
      }, 0) / (data.length - 1));
};

function standardError(data){
  return standardDeviation(data) / Math.sqrt(data.length);
}

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
              Messages: msgs[sizes.indexOf(ms)],
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

let totalDataToSend = _.sumBy(tests, t => {
  return t.Complete ? 0 : t.Messages * t.MessageSize;
});
let dataSent = 0;

let startTime = new Date();
tests.forEach(t => {
  if (!t.Complete) {
    try {
      let elapsedTime = new Date().getTime() - startTime.getTime();
      let percentageDone = ((dataSent * 100) / totalDataToSend).toFixed(2);
      let totalEstimatedTime = (elapsedTime * totalDataToSend) / dataSent;
      let remainingTime = totalEstimatedTime - elapsedTime;

      console.log(
        `Sent ${dataSent.toFixed(0) / 1000} / ${totalDataToSend /
          1000} bytes:\t${percentageDone}% \nEst. time remaining:\t${msConversion(
          remainingTime
        )}`
      );

      let filename = `csv/REP_${t.Server}_${t.Subscribers}_${t.Publishers}_${t.Messages}_${t.MessageSize}.csv`;
      const { stdout, stderr, code } = shell.exec(
        `./bench -s ${t.Server} -ns ${t.Subscribers} -np ${t.Publishers} -n ${t.Messages} -ms ${t.MessageSize} -csv ${filename} ${topic}`,
        { silent: true }
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
      dataSent += t.MessageSize * t.Messages;
      fs.writeFileSync(fn, JSON.stringify({ tests }));
      console.clear();
    } catch (error) {
      console.error(error);
    }
  } else {
    console.info("Skipping complete test");
  }
});

let groupedResults = tests.map(function(t){
  let comparableTests = tests.filter(test => {
    return test.Subscribers == t.Subscribers &&
           test.Publishers == t.Publishers &&
           test.MessageSize == t.MessageSize
  });

  let group = {
    Subscribers : t.Subscribers,
    Publishers : t.Publishers,
    MessageSize : t.MessageSize,
  };
  group.MeanPublisherMessageRate = mean(comparableTests.map(x => x.PublisherAverageMsgsPerSec));
  group.MeanSubscriberMessageRate = mean(comparableTests.map(x => x.SubscriberAverageMsgsPerSec));
  group.MeanPublisherBytesPerSec = mean(comparableTests.map(x => x.PublisherAverageBytesPerSec));
  group.MeanSubscriberBytesPerSec = mean(comparableTests.map(x => x.SubscriberAverageBytesPerSec));

  group.StandardErrorPublisherMessageRate = standardError(comparableTests.map(x => x.PublisherAverageMsgsPerSec));
  group.StandardErrorSubscriberMessageRate =standardError(comparableTests.map(x => x.SubscriberAverageMsgsPerSec));
  group.StandardErrorPublisherBytesPerSec = standardError(comparableTests.map(x => x.PublisherAverageBytesPerSec));
  group.StandardErrorSubscriberBytesPerSec = standardError(comparableTests.map(x => x.SubscriberAverageBytesPerSec));

  return group;
});

groupedResults = _.uniqBy(groupedResults, g => `${g.MessageSize}-${g.Publishers}-${g.Subscribers}`);

//write grouped tests to disk
fs.writeFileSync(
  `${results_folder}/grouped_${dateFormat(testDate, "yyyy-mm-dd'T'HH:MM")}.json`,
  JSON.stringify({ groupedResults })
);
new ObjectsToCsv(groupedResults).toDisk(
  `${results_folder}/grouped_${dateFormat(testDate, "yyyy-mm-dd'T'HH:MM")}.csv`
);


//write all tests to disk
fs.writeFileSync(
  `${results_folder}/${dateFormat(testDate, "yyyy-mm-dd'T'HH:MM")}.json`,
  JSON.stringify({ tests })
);
new ObjectsToCsv(tests).toDisk(
  `${results_folder}/${dateFormat(testDate, "yyyy-mm-dd'T'HH:MM")}.csv`
);