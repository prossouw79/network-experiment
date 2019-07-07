const Kafka = require('node-rdkafka');
const dotenv = require('dotenv');
const asTable = require('as-table')
var path = require('path');
var scriptName = path.basename(__filename);

let args = process.argv.slice(2);
if (args.length != 1) {
  console.error(`Run with '${scriptName}' <nodeID>`)
  process.exit(0)
}


const operatorID = args[0];

//functions 
const getRandomInt = require('./util/randomInt');
let _guid = require('./util/guid.js');
let produceMessage = require('./util/kafka_produceMessage.js');
let _moveTo = require('./util/moveTo');
let _moveFrom = require('./util/moveFrom');
let _moveRandom = require('./util/moveRandom');

dotenv.config();
let currentPosition = {
  "NodeID": operatorID,
  "x": 0,
  "y": 0,
  "z": 0
}
let moveSpeed = 5;

let initObj = {};
Object.keys(process.env)
  .filter(x => x.startsWith("KAFKA"))
  .forEach(x => initObj[`${x}`] = process.env[x]);

console.log(asTable([initObj]))


let lastMovement = new Date().getTime();
const _position_topic = process.env.KAFKA_TOPIC_POSITION;
const _movement_topic = `${process.env.KAFKA_TOPIC_MOVEMENT}_${operatorID}`


//#region Position Consumer
var movement_consumer = new Kafka.KafkaConsumer({
  //'debug': 'all',
  'metadata.broker.list': `${process.env.KAFKA_BROKER}:${process.env.KAFKA_BROKER_PORT}`,
  'queue.buffering.max.kbytes': process.env.KAFKA_QUEUE_BUFFER,
  'group.id': `movement-actions`,
  'client.id': `movement-actions-global`, //use the same client id to get all message
  'enable.auto.commit': true,
});

//logging debug messages, if debug is enabled
movement_consumer.on('event.log', function (log) {
  console.log(log);
});

//logging all errors
movement_consumer.on('event.error', function (err) {
  console.error('Error from consumer');
  console.error(err);
  process.exit(1);
});

movement_consumer.on('ready', function (arg) {
  console.log('consumer ready.' + JSON.stringify(arg));

  movement_consumer.subscribe([_movement_topic]);
  //start consuming messages
  movement_consumer.consume();
});


movement_consumer.on('data', function (m) {
  // Output the actual message contents
  // console.log(JSON.stringify(m));
  let receivedObj = JSON.parse(m.value.toString());
  // console.log(receivedObj);
  if ((new Date().getTime() - lastMovement) > 500) {
    if (receivedObj.Movement == 'away') {
      console.log('moving from ', receivedObj.Target.NodeID);
      console.log(currentPosition);
      currentPosition = _moveFrom(currentPosition, receivedObj.Target, moveSpeed);
      lastMovement = new Date().getTime();
    }

    if (receivedObj.Movement == 'towards') {
      console.log('moving towards ', receivedObj.Target.NodeID);
      console.log(currentPosition);
      currentPosition = _moveTo(currentPosition, receivedObj.Target, moveSpeed);
      lastMovement = new Date().getTime();
    }
  }
  // console.log(currentPosition);
});

movement_consumer.on('disconnected', function (arg) {
  console.log('consumer disconnected. ' + JSON.stringify(arg));
});

//starting the consumer
movement_consumer.connect();
//#endregion

//#region position broadcast
var position_producer = new Kafka.Producer({
  'metadata.broker.list': `${process.env.KAFKA_BROKER}:${process.env.KAFKA_BROKER_PORT}`,
  'queue.buffering.max.kbytes': process.env.KAFKA_QUEUE_BUFFER,
  'dr_cb': true
});

// Connect to the broker manually
position_producer.connect();

// Wait for the ready event before proceeding
position_producer.on('ready', function () {
  setInterval(() => {
    if ((new Date().getTime() - lastMovement) > 2000) {
      currentPosition = _moveRandom(1, currentPosition);
      lastMovement = new Date().getTime();
      console.clear();
      console.log('moving randomly')
      console.log(currentPosition)
    } else {
      produceMessage(position_producer, _position_topic, JSON.stringify(currentPosition), operatorID);
    }
  }, 50);
});

position_producer.on('delivery-report', function (err, report) {
  // Report of delivery statistics here:
  //
  console.log(report);
});

// Any errors we encounter, including connection errors
position_producer.on('event.error', function (err) {
  console.error('Error from producer');
  console.error(err);
  process.exit(1);
})

  //#endregion