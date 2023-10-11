class curryPot {
  constructor(...args) {
    this.deployable = this.makeCurry(args);
  }

  makeCurry(args) {
    var func = args[0];
    var postCallback=args[1]
    var others = args.splice(2, args.length);
    // console.log("makeCurry summary", func, others);

    const curriedFunc = this.curry(func,postCallback); // curry the add function and delay execution
    const deployReady = curriedFunc.apply(this, others); // pass all arguments at once and delay execution
    return deployReady;
  }

  curry(func,postCallback) {
    return function curried(...args) {
      return async function readyToDeploy() {
        var ret=await func.apply(this, args);
        if(postCallback!=null){
          postCallback.deployable()
        }
        return ret
      };
    };
  }

  setVars(priority, iniCost, reservedTokens) {
    this.iniCost = iniCost;
    this.priority = priority;
    this.reservedTokens = reservedTokens;
    // this.tracker = tracker;
  }

  setIniCost(iniCost) {
    this.iniCost = iniCost;
  }

  setPriority(priority) {
    this.priority = priority;
  }

  setReservedTokens(reservedTokens) {
    this.reservedTokens = reservedTokens;
  }

  // setTracker(tracker) {
  //   this.tracker = tracker;
  // }

  setTag(tag) {
    this.tag = tag;
  }

  static compareCurryPot(curryPotA, curryPotB) {
    return curryPotA.priority < curryPotB.priority;
  }
}

module.exports = curryPot;
