const kue = require('kue')

let queue = kue.createQueue({
    prefix: 'q',
    redis: {
      port: 7777,
      host: '127.0.0.1',
    //   auth: 'password',
    //   db: 3, // if provided select a non-default redis db
    //   options: {
    //     // see https://github.com/mranney/node_redis#rediscreateclient
    //   }
    }
  });

  module.exports = queue;