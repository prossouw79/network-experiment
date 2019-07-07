function produceMessage(producer,topic,message, key) {
    try {
        console.log('Sending', message)
  
        let buffer =  Buffer.from(message);
        // console.log(message,buffer)
  
        producer.produce(
          // Topic to send the message to
          topic,
          // optionally we can manually specify a partition for the message
          // this defaults to -1 - which will use librdkafka's default partitioner (consistent random for keyed messages, random for unkeyed messages)
          null,
          // Message to send. Must be a buffer
          buffer,
          // for keyed messages, we also specify the key - note that this field is optional
          key,
          // you can send a timestamp here. If your broker version supports it,
          // it will get added. Otherwise, we default to 0
          Date.now(),
          // you can send an opaque token here, which gets passed along
          // to your delivery reports
        );
      } catch (err) {
        console.error('A problem occurred when sending our message');
        console.error(err);
      }
  }

  module.exports = produceMessage;