const Kafka = require('node-rdkafka');
const dotenv = require('dotenv');
const asTable = require('as-table')
require('lodash.combinations');
const _ = require('lodash');

//functions 
const getRandomInt = require('./util/randomInt');
let _guid = require('./util/guid.js');
let _distanceBetween = require('./util/distance.js');
let _averagePosition = require('./util/averagePosition.js')
let produceMessage = require('./util/kafka_produceMessage.js');

let nodePositions = {}
let nodeDistances = []

let operatorID = _guid(1);
dotenv.config();

let initObj = {};
Object.keys(process.env)
  .filter(x => x.startsWith("KAFKA"))
  .forEach(x => initObj[`${x}`] = process.env[x]);

console.log(asTable([initObj]))

const _position_topic = process.env.KAFKA_TOPIC_POSITION;
const _distance_topic = process.env.KAFKA_TOPIC_DISTANCE;

//#region Position Consumer
var position_consumer = new Kafka.KafkaConsumer({
  //'debug': 'all',
  'metadata.broker.list': `${process.env.KAFKA_BROKER}:${process.env.KAFKA_BROKER_PORT}`,
  'queue.buffering.max.kbytes': process.env.KAFKA_QUEUE_BUFFER,
  'group.id': `position-distance-calculators`,
  'client.id': `position-distance-calculator-${operatorID}`,
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

  position_consumer.subscribe([_position_topic]);
  //start consuming messages
  position_consumer.consume();
});


position_consumer.on('data', function (m) {
  // Output the actual message contents
  // console.log(JSON.stringify(m));
  let receivedObj = JSON.parse(m.value.toString());
  // console.log(receivedObj);
  nodePositions[receivedObj.NodeID] = receivedObj;
  nodeDistances = [];

  _averagePosition(nodePositions, process.env.KAFKA_AVG_POS_KEY)

  console.clear()
  console.log('Average Position', nodePositions[process.env.KAFKA_AVG_POS_KEY])

  let nodeCombinations = _.combinations(Object.keys(nodePositions), 2);

  _.orderBy(nodeCombinations, x => x[0])
    .forEach(pair => {
      let nodeA = nodePositions[pair[0]];
      let nodeB = nodePositions[pair[1]];

      let d = _distanceBetween(nodeA, nodeB);
      console.log(`Calculated distance: ${nodeA.NodeID}\t${nodeB.NodeID}: ${d.toFixed(2)}`);

      nodeDistances.push({
        A: nodeA,
        B: nodeB,
        distance: d
      });
    });

  // console.log(nodeDistances)
  let message = JSON.stringify(nodeDistances);
  produceMessage(distance_producer, _distance_topic, message, operatorID);
});

position_consumer.on('disconnected', function (arg) {
  console.log('consumer disconnected. ' + JSON.stringify(arg));
});

//starting the consumer
position_consumer.connect();

//#endregion


//#region Distance Producer

var distance_producer = new Kafka.Producer({
  'metadata.broker.list': `${process.env.KAFKA_BROKER}:${process.env.KAFKA_BROKER_PORT}`,
  'queue.buffering.max.kbytes': process.env.KAFKA_QUEUE_BUFFER,
  'dr_cb': true
});


// Connect to the broker manually
distance_producer.connect();

// Wait for the ready event before proceeding
distance_producer.on('ready', function () {
  console.log('Producer ready')
});

distance_producer.on('delivery-report', function (err, report) {
  // Report of delivery statistics here:
  //
  console.log(report);
});



// Any errors we encounter, including connection errors
distance_producer.on('event.error', function (err) {
  console.error('Error from producer');
  console.error(err);
})
//#endregion