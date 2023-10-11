// const fs = require('fs');
//https://stackoverflow.com/questions/10685998/how-to-update-a-value-in-a-json-file-and-save-it-through-node-js
function jsonUpdate(fs, fileName, data) {
  fs.writeFile(
    fileName,
    JSON.stringify(data, null, 2),
    function writeJSON(err) {
      if (err) return console.log(err);
      //console.log(JSON.stringify(data,null,2));
      //console.log('writing to ' + fileName);
    }
  );
}

function jsonUpdateSync(fs, fileName, data) {
  fs.writeFileSync(
    fileName,
    JSON.stringify(data, null, 2),
    function writeJSON(err) {
      if (err) return console.log(err);
      //console.log(JSON.stringify(data,null,2));
      //console.log('writing to ' + fileName);
    }
  );
}

function compareSteamID(id1, id2) {
  return (
    id1.low == id2.low && id1.high == id2.high && id1.unsigned == id2.unsigned
  );
}

function timeUntil(length, current, target) {
  if (current > target) {
    return length - current + target;
  } else {
    return target - current;
  }
}

function rustMinutes(val, dayLength) {
  var minsPerHour = dayLength / 24;
  return val * minsPerHour;
}

//https://stackoverflow.com/questions/7342957/how-do-you-round-to-1-decimal-place-in-javascript
function round(value, precision) {
  var multiplier = Math.pow(10, precision || 0);
  return Math.round(value * multiplier) / multiplier;
}

function delay(time) {
  return new Promise((resolve) => setTimeout(resolve, time));
}

function orderParser(orders, itemDB) {
  var orderString = "";
  //   console.log(`FOR EACH THESE ${JSON.stringify(orders)}`)
  if (orders != undefined) {
    orders.forEach((order) => {
      var itemBp = order.itemIsBlueprint ? "BP " : "";
      var currencyBP = order.currencyIsBlueprint ? "BP " : "";
      var itemName = itemDB.hasOwnProperty(order.itemId)
        ? itemDB[order.itemId].name
        : order.itemId;
      var currencyName = itemDB.hasOwnProperty(order.currencyId)
        ? itemDB[order.currencyId].name
        : order.currencyId;
      orderString += `${order.quantity} ${itemBp}${itemName} | ${order.costPerItem} ${currencyBP}${currencyName} (${order.amountInStock})\n`;
    });
  }
  if (orderString == "") {
    orderString = "NO ORDERS";
  }

  return orderString;
  // "itemId": 443432036,
  // "quantity": 1,
  // "currencyId": -932201673,
  // "costPerItem": 30,
  // "amountInStock": 10,
  // "itemIsBlueprint": false,
  // "currencyIsBlueprint": false
}

//https://usefulangle.com/post/187/nodejs-get-date-time
function ts(val) {
  let date_ob = new Date();

  // current date
  // adjust 0 before single digit date
  let date = ("0" + date_ob.getDate()).slice(-2);

  // current month
  let month = ("0" + (date_ob.getMonth() + 1)).slice(-2);

  // current year
  let year = date_ob.getFullYear();

  // current hours
  let hours = date_ob.getHours();

  // current minutes
  let minutes = date_ob.getMinutes();

  // current seconds
  let seconds = date_ob.getSeconds();

  if (val == 1) {
    // prints time in HH:MM format
    return hours + ":" + minutes;
  } else if (val == 2) {
    return new Date().toLocaleString();
    return hours + ":" + minutes + ":" + seconds;
  }else if (val == 3) {
    return new Date().getTime()
  }
}

function intToChar(integer) {
  var charZero = "A".charCodeAt(0);
  return String.fromCharCode(charZero + integer);
}

function rustCoords(x, y, mapSize, squaresX, squaresY) {
  var squareSizeX = mapSize / squaresX;
  var squareSizeY = mapSize / squaresY;
  var xSquares = x / squareSizeX;
  var ySquares = y / squareSizeY;

  var ySqCoord = squaresY - ySquares;
  var xPercent = NaN;
  var l1;
  var l2;
  var letters;
  if (xSquares / 26 > 1) {
    l1 = Math.trunc(Math.trunc(xSquares) / 26) - 1;
    l2 = Math.trunc(round(xSquares / 26 - Math.trunc(xSquares / 26), 2) * 26);
    // console.log(xSquares)
    // console.log(xSquares/26)
    // console.log(Math.trunc(xSquares/26))
    // console.log(xSquares/26-(Math.trunc(xSquares/26)))
    // console.log(round(xSquares/26-(Math.trunc(xSquares/26)),2)*26)
    // console.log(l2)
    letters = `${intToChar(l1)}${intToChar(l2)}`;
  } else {
    l1 = Math.trunc(xSquares);
    letters = `${intToChar(l1)}`;
  }
  xPercent = xSquares - Math.trunc(xSquares);

  return `${letters}${round(ySqCoord, 2)} Letter in ${round(xPercent, 2)}`;
}

//stackoverflow.com/questions/9614109/how-to-calculate-an-angle-from-points
function angle(ax, ay, px, py) {
  // var dy = ey - cy;
  // var dx = ex - cx;
  // var theta = Math.atan2(dy, dx); // range (-PI, PI]
  // theta *= 180 / Math.PI; // rads to degs, range (-180, 180]
  // if (theta < 0) {
  //   theta = 360 + theta; // range [0, 360)
  // }
  theta= Math.atan2(ay - py, ax - px) * 180 / Math.PI + 180
  return theta;
}

// Converts from degrees to radians.
function toRadians(degrees) {
  return degrees * Math.PI / 180;
};
 
// Converts from radians to degrees.
function toDegrees(radians) {
  return radians * 180 / Math.PI;
}


function bearing(startLat, startLng, destLat, destLng){
  startLat = toRadians(startLat);
  startLng = toRadians(startLng);
  destLat = toRadians(destLat);
  destLng = toRadians(destLng);

  y = Math.sin(destLng - startLng) * Math.cos(destLat);
  x = Math.cos(startLat) * Math.sin(destLat) -
        Math.sin(startLat) * Math.cos(destLat) * Math.cos(destLng - startLng);
  brng = Math.atan2(y, x);
  brng = toDegrees(brng);
  return (brng + 360) % 360;
}




module.exports.jsonUpdate = jsonUpdate;
module.exports.jsonUpdateSync = jsonUpdateSync;
module.exports.compareSteamID = compareSteamID;
module.exports.rustMinutes = rustMinutes;
module.exports.timeUntil = timeUntil;
module.exports.round = round;
module.exports.ts = ts;
module.exports.delay = delay;
module.exports.rustCoords = rustCoords;
module.exports.orderParser = orderParser;
module.exports.angle = angle;
module.exports.bearing = bearing;
