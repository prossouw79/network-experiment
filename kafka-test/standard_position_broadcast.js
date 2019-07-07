const Kafka = require('node-rdkafka');
const dotenv = require('dotenv');
const asTable = require ('as-table')



//functions 
const getRandomInt = require('./util/randomInt');
let _guid = require('./util/guid.js');
let produceMessage = require('./util/kafka_produceMessage.js');


let operatorID = _guid(1);
dotenv.config();
let currentPosition = {
    "NodeID": operatorID,
    "x": 0,
    "y": 0,
    "z": 0,
    "DistanceMoved": 0,
    "AverageSpeed": 0
}

let initObj = {};
Object.keys(process.env)
    .filter(x => x.startsWith("KAFKA"))
    .forEach(x => initObj[`${x}`] = process.env[x]);

console.log(asTable([initObj]))
console.log('');

var producer = new Kafka.Producer({
    'metadata.broker.list': `${process.env.KAFKA_BROKER}:${process.env.KAFKA_BROKER_PORT}`,
    'dr_cb': true
  });

const _topic = process.env.KAFKA_TOPIC_POSITION;

  
  // Connect to the broker manually
  producer.connect();
  
  // Wait for the ready event before proceeding
  producer.on('ready', function() {
      setInterval(() => {
        let message = JSON.stringify(currentPosition);

        produceMessage(producer,_topic,message,operatorID);

      }, 1000);
  });

  producer.on('delivery-report', function(err, report) {
    // Report of delivery statistics here:
    //
    console.log(report);
  });
  
  // Any errors we encounter, including connection errors
  producer.on('event.error', function(err) {
    console.error('Error from producer');
    console.error(err);
  })