const Camera = require("@liamcottle/rustplus.js/camera.js");
class MyCamera extends Camera {
  constructor(rustplus, indentifier) {
    super(rustplus, indentifier);
  }

  async subscribe(delay) {
    // console.log("SUBSCRIBING CP "+this.identifier)
    this.emit("subscribing");

    // subscribe to camera
    // await this._subscribe();

    

    // automatically resubscribe to the camera every 10 seconds
    if (delay == 0) {
      try {
        await this._subscribe();
      } catch (error) {
        // console.log("A " + JSON.stringify(error));
      }
    } else {
      this.subscribeInterval = setInterval(async () => {
        if (this.isSubscribed) {
          try {
            await this._subscribe();
          } catch (error) {
            // console.log("B " +  JSON.stringify(error));
          }
        }
      }, delay);
    }

    this.emit("subscribed");
  }
}

module.exports = MyCamera;
