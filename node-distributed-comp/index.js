var Supertask = require('supertask');
var TaskManager = new Supertask();

var taskLocal = TaskManager.addLocal('taskname', function power(n, x, callback) {
    // n^x function
    callback(null, Math.pow(n,x));
});

TaskManager.do('taskname', 2, 4, function callback(error, result) {
    console.log("LOCAL: 2^4 is equal to", result);
});

var source = "module.exports = function power(n, x, callback) { callback(null, Math.pow(n,x)); }";
var taskForeign = TaskManager.addForeign('foreignPow', source);

TaskManager.do('foreignPow',3,3, function callback(error,result){
    console.log("FOREIGN: 3^3 is equal to", result);
});