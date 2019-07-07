const Kafka = require('node-rdkafka');
var filter = require("stream-filter");

var inputStream = Kafka.KafkaConsumer.createReadStream({
    'metadata.broker.list': 'localhost:9092',
    'group.id': 'librd-test',
    'socket.keepalive.enable': true,
    'enable.auto.commit': true
}, {}, {
        topics: 'all-numbers',
        waitInterval: 0,
        objectMode: false
    });

var evenNumberStream = Kafka.Producer.createWriteStream({
    'metadata.broker.list': 'localhost:9092',
    'socket.keepalive.enable': true,
}, {}, {
        topic: 'even-numbers'
    });

var oddNumberStream = Kafka.Producer.createWriteStream({
    'metadata.broker.list': 'localhost:9092',
    'socket.keepalive.enable': true,
}, {}, {
        topic: 'odd-numbers'
    });

inputStream.on('error', function (err) {
    if (err) console.log(err);
    process.exit(1);
});

inputStream
    .pipe(filter(data => {
        let odd = data % 2 != 0;
        if(odd)
            console.log(data, " is odd!");
        return odd;
    }))
    .pipe(oddNumberStream);

inputStream
    .pipe(filter(data => {
        let even = data % 2 == 0;
        if(even)
            console.log(data, " is even!");
        return even;
    }))
    .pipe(evenNumberStream);

inputStream.on('error', function (err) {
    console.log(err);
    process.exit(1);
});

inputStream.consumer.on('event.error', function (err) {
    console.log(err);
});