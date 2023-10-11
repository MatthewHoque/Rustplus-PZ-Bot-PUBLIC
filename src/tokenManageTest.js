const { EventEmitter } = require("events");
const FastPriorityQueue = require("fastpriorityqueue");
const tokenTracker = require("./tokenTracker.js");
const curryPot = require("./curryPot.js");
const throttler = require("./throttler.js");
const helpers = require("./helpers.js");

async function testing1(a, b, c) {
  console.log("predelay=============" + a);
  await helpers.delay(5000);
  console.log("postdelkay============" + a);
  console.log(a + " | " + b + " | " + c + " testing1");
}
function testing2(tracker, amount, tag) {
  console.log("after the main curry " + tag);
  tracker.releaseTokens(amount);
}

var throt = new throttler();
var i = 10;
var j = 20;
for (var j = 0; j < 15; j++) {
  var postCallCurry = new curryPot(testing2, null, throt.tracker, 5, j);

  var testCurry = new curryPot(testing1, postCallCurry, j, j + 1, j + 2);
  testCurry.setVars(2, 5, 5, throt.tracker);
  testCurry.setTag("T1TESTING");

  throt.queueReq(testCurry);
}
// var t2 = new curryPot(testing1, i + 5, i + 15, i + 15);
// t2.setVars(2, 1, 5, throt.tracker);
// t2.setTag("T2 testing2");
// t2.setPostCallback((thisCurry) => {
//   console.log("POSTCALLBACK OF TESTING2");
//   //   thisCurry.tracker;
//   thisCurry.tracker.releaseTokens(thisCurry.reservedTokens);
// });
// // }

// var t3 = new curryPot(testing1, i + 3, i + 13, i + 13);
// t3.setVars(0, 2, 5, throt.tracker);
// t3.setTag("T3 testing3");
// t3.setPostCallback((thisCurry) => {
//   console.log("T3 SHOULD BE FIRST");
//   //   thisCurry.tracker;
//   thisCurry.tracker.releaseTokens(thisCurry.reservedTokens);
// });
// // }

// console.log("prior");

// throt.queueReq(testCurry);
// throt.queueReq(t2);
// throt.queueReq(t3);
// throt.queue.forEach((val, index) => {
//   console.log("===Queue Report after all Added==");
//   console.log(val.tag, index);
//   console.log("=====");
// });
console.log("BEGINNING LOOP");
throt.processQueueLoop();
