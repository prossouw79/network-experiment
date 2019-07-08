const Kafka = require('node-rdkafka');
const dotenv = require('dotenv');
const asTable = require('as-table')

//functions 
const getRandomInt = require('./util/randomInt');
let _guid = require('./util/guid.js');
let produceMessage = require('./util/kafka_produceMessage.js');

let nodePositions = {}
let nodeDistances = {}

let operatorID = _guid(1);
dotenv.config();

let initObj = {};
Object.keys(process.env)
  .filter(x => x.startsWith("KAFKA"))
  .forEach(x => initObj[`${x}`] = process.env[x]);

console.log(asTable([initObj]))

const _distance_topic = process.env.KAFKA_TOPIC_DISTANCE;
const _movement_topic = process.env.KAFKA_TOPIC_MOVEMENT;
let min_threshold = 5;
let max_threshold = 25;


//#region Position Consumer
var position_consumer = new Kafka.KafkaConsumer({
  //'debug': 'all',
  'metadata.broker.list': `${process.env.KAFKA_BROKER}:${process.env.KAFKA_BROKER_PORT}`,
  'queue.buffering.max.kbytes': process.env.KAFKA_QUEUE_BUFFER,
  'queue.buffering.max.kbytes': 1000000,
  'group.id': `distance-movement-calculators`,
  'client.id': `distance-movement-calculator-${operatorID}`,
  'enable.auto.commit': true,
  'rebalance_cb': function (err, assignment) {

    if (err.code === Kafka.CODES.ERRORS.ERR__ASSIGN_PARTITIONS) {
      // Note: this can throw when you are disconnected. Take care and wrap it in
      // a try catch if that matters to you
      this.assign(assignment);
    } else if (err.code == Kafka.CODES.ERRORS.ERR__REVOKE_PARTITIONS) {
      // Same as above
      this.unassign();
    } else {
      // We had a real error
      console.error(err);
    }
  }
});

//logging debug messages, if debug is enabled
position_consumer.on('event.log', function (log) {
  console.log(log);
});

//logging all errors
position_consumer.on('event.error', function (err) {
  console.error('Error from consumer');
  console.error(err);
  process.exit(1);
});

position_consumer.on('ready', function (arg) {
  console.log('consumer ready.' + JSON.stringify(arg));

  position_consumer.subscribe([_distance_topic]);
  //start consuming messages
  position_consumer.consume();
});


position_consumer.on('data', function (m) {
  // Output the actual message contents
  // console.log(JSON.stringify(m));

  let distancePairs = JSON.parse(m.value.toString());
  // console.log(distancePairs);

  let nodesTooClose = distancePairs
    .filter(x => x.distance < min_threshold);

  let nodesTooFar = distancePairs
    .filter(x => x.distance > max_threshold);

  console.log('Too Close\t', nodesTooClose.map(x => {
    return {
      "A": x.A.NodeID,
      "B": x.B.NodeID
    }
  }));
  console.log('Too Far\t\t', nodesTooFar.map(x => {
    return {
      "A": x.A.NodeID,
      "B": x.B.NodeID
    }
  }));

  nodesTooClose.forEach(node => {
    //A needs to move further from B
    let messageA = {
      "Movement": "away",
      "Target": node.B
    }
    //B needs to move further from A
    let messageB = {
      "Movement": "away",
      "Target": node.A
    }

    produceMessage(movement_producer, `${_movement_topic}_${node.A.NodeID}`, JSON.stringify(messageA));
    produceMessage(movement_producer, `${_movement_topic}_${node.B.NodeID}`, JSON.stringify(messageB));
  });


  nodesTooFar.forEach(node => {
    //A needs to move further from B
    let messageA = {
      "Movement": "towards",
      "Target": node.B
    }
    //B needs to move further from A
    let messageB = {
      "Movement": "towards",
      "Target": node.A
    }

    produceMessage(movement_producer, `${_movement_topic}_${node.A.NodeID}`, JSON.stringify(messageA));
    produceMessage(movement_producer, `${_movement_topic}_${node.B.NodeID}`, JSON.stringify(messageB));
  });



  // Object.keys(distancePairs)
  //   .forEach(nodeID => {
  //     let relativeDistances = distancePairs[nodeID];

  //     let nodesTooClose =
  //       Object.keys(relativeDistances)
  //         .filter(x => relativeDistances[x] < min_threshold);

  //     let nodesTooFar =
  //       Object.keys(relativeDistances)
  //         .filter(x => relativeDistances[x] > max_threshold);

  //     console.log('Too Close\t', nodeID, nodesTooClose);
  //     console.log('Too Far\t\t', nodeID, nodesTooFar);




  //   });
});

position_consumer.on('disconnected', function (arg) {
  console.log('consumer disconnected. ' + JSON.stringify(arg));
});

//starting the consumer
position_consumer.connect();

//#endregion


//#region Movement Producer

var movement_producer = new Kafka.Producer({
  'metadata.broker.list': `${process.env.KAFKA_BROKER}:${process.env.KAFKA_BROKER_PORT}`,
  'queue.buffering.max.kbytes': process.env.KAFKA_QUEUE_BUFFER,
  'dr_cb': true
});


// Connect to the broker manually
movement_producer.connect();

// Wait for the ready event before proceeding
movement_producer.on('ready', function () {
  console.log('Producer ready')
});

movement_producer.on('delivery-report', function (err, report) {
  // Report of delivery statistics here:
  //
  console.log(report);
});

// Any errors we encounter, including connection errors
movement_producer.on('event.error', function (err) {
  console.error('Error from producer');
  console.error(err);
  process.exit(1);
})
//#endregion