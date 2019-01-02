var discovery = require('dns-discovery')
const fs = require('fs');
var ping = require('ping');
var argv = require('minimist')(process.argv.slice(2));

var availableArgs = [{
    arg: '-i',
    descr: 'Update interval, e.g. - i 1000 ',
    default: '2000'
  }, {
    arg: '-a',
    descr: 'App identifier to only discover certain nodes',
    default: 'Default'
  },
  {
    arg: '-m',
    descr: 'Toggle writing structured MPI machine files',
    default: 'false'
  },
  {
    arg: '-l',
    descr: 'Toggle detailed logging',
    default: 'true'
  }
]

//parse arguments
if (argv['h']) {
  console.info('Arguments: Description | Default');

  availableArgs.forEach(a => {
    console.info(`${a.arg.padEnd(5)} - ${a.descr.padEnd(50)} | ${a.default.padEnd(10)}`);
  });

  process.exit();
}

var disc1 = discovery()
var disc2 = discovery()

let ipAddresses = [];
let announceInterval = argv['i'] && !isNaN(+argv['i']) ? +argv['i'] : 2000;
let appName = argv['a'] ? argv['a'] : 'Default';
let writeMPI = argv['m'] ? true : false;
let logging = argv['l'] ? true : false;

console.log(`Conf: \r\n Interval: ${announceInterval} \r\n App name: ${appName} \r\n Writing Machine Files: ${writeMPI} \r\n Logging: ${logging}`)

//when others announce themselves
disc1.on('peer', function (name, peer) {
  let address = peer.host;

  let exists = ipAddresses.some(function (i) {
    return i.ip == address;
  })

  //fix this
  if (!exists) {
    ipAddresses.push({
      ip: address,
      alive: false
    });
  }
});

function announceMyself() {
  // announce myself
  disc2.announce(appName, 9090)
}

function testConn(_ip) {
  //if not working, check that host is allowed to use socket ping,
  //if not, run sudo setcap 'cap_net_raw=+ep' $(which ping)

  ping.sys.probe(_ip, function (isAlive) {
    ipAddresses.forEach(ipaddress => {
      if (ipaddress.ip == _ip) {
        ipaddress.alive = isAlive;
      }
    });
  });

}

function writeMPICHMachineFile(filename, ipList, numThreads = 4) {
  let machinefile = "";

  ipList = filterIpAddresses(ipList);

  ipList.forEach(host => {
    machinefile += `${host.ip}:${numThreads}\r\n`
  });

  fs.writeFile(filename, machinefile, function (err) {
    if (err) {
      return console.log(err);
    }
  });
}

function writeOpenMPIMachineFile(filename, ipList, numThreads = 4) {
  let machinefile = "";

  ipList = filterIpAddresses(ipList);

  ipList.forEach(host => {
    machinefile += `${host.ip} slots=${numThreads} max-slots=${numThreads}\r\n`
  });

  fs.writeFile(filename, machinefile, function (err) {
    if (err) {
      return console.log(err);
    }
  });
}


function filterIpAddresses(list) {
  //test if reachable
  list.forEach(l => {
    testConn(l.ip);
  });

  //remove dead hosts
  list = list.filter(function (i) {
    return i.alive;
  });

  //unique addresses only
  list = uniqBy(list, function (i) {
    return i.ip
  });

  return list;
}

const uniqBy = (arr, predicate) => {
  const cb = typeof predicate === 'function' ? predicate : (o) => o[predicate];

  return [...arr.reduce((map, item) => {
    const key = cb(item);

    map.has(key) || map.set(key, item);

    return map;
  }, new Map()).values()];
};

announceMyself();


setInterval(function () {

  ipAddresses.forEach(el => {
    testConn(el.ip);
  });
}, Math.trunc(announceInterval / 2));


setInterval(function () {

  ipAddresses = filterIpAddresses(ipAddresses);
  if (writeMPI == true) {
    writeMPICHMachineFile('machinefile.mpich', ipAddresses, 4);
    writeOpenMPIMachineFile('machinefile.openmpi', ipAddresses, 4)
  }
  console.clear();
  if (logging) {
    console.log(`Filtered List:`);
    console.log(JSON.stringify(ipAddresses, null, 2));
  } else {
    console.log(`Peers discovered ${ipAddresses.length}`)
  }

  announceMyself();
}, announceInterval);