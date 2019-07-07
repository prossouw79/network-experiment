const Kafka = require('node-rdkafka');
const dotenv = require('dotenv');
const asTable = require('as-table')

//functions 
const getRandomInt = require('./util/randomInt');
let _guid = require('./util/guid.js');
let _distanceBetween = require('./util/distance.js');
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

const _position_topic = process.env.KAFKA_TOPIC_POSITION;
const _distance_topic = process.env.KAFKA_TOPIC_DISTANCE;

//#region Position Consumer
var position_consumer = new Kafka.KafkaConsumer({
  //'debug': 'all',
  'metadata.broker.list': `${process.env.KAFKA_BROKER}:${process.env.KAFKA_BROKER_PORT}`,
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

  nodePositions[receivedObj.NodeID] = {
    x: receivedObj.x,
    y: receivedObj.y,
    z: receivedObj.z
  }

  Object.keys(nodePositions).forEach(nodeA => {
    Object.keys(nodePositions).forEach(nodeB => {
      if (nodeA != nodeB) {
        let d = _distanceBetween(nodePositions[nodeA], nodePositions[nodeB]);

        if (!nodeDistances[nodeA])
          nodeDistances[nodeA] = {};

          nodeDistances[nodeA][nodeB] = d;
      }
    });
    let message = JSON.stringify(nodeDistances);
    produceMessage(distance_producer,_distance_topic,message, operatorID);
  });
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
  'dr_cb': true
});


// Connect to the broker manually
distance_producer.connect();

// Wait for the ready event before proceeding
distance_producer.on('ready', function() {
  console.log('Producer ready')
});

distance_producer.on('delivery-report', function(err, report) {
  // Report of delivery statistics here:
  //
  console.log(report);
});



// Any errors we encounter, including connection errors
distance_producer.on('event.error', function(err) {
  console.error('Error from producer');
  console.error(err);
})
//#endregion