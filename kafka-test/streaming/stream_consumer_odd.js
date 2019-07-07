const Kafka = require('node-rdkafka');
var filter = require("stream-filter");

var inputStream = Kafka.KafkaConsumer.createReadStream({
    'metadata.broker.list': 'localhost:9092',
    'group.id': 'librd-test',
    'socket.keepalive.enable': true,
    'enable.auto.commit': true
}, {}, {
        topics: 'odd-numbers',
        waitInterval: 0,
        objectMode: false
    });

inputStream.on('error', function (err) {
    if (err) console.log(err);
    process.exit(1);
});

inputStream
    .pipe(process.stdout);


inputStream.on('error', function (err) {
    console.log(err);
    process.exit(1);
});

inputStream.consumer.on('event.error', function (err) {
    console.log(err);
});


