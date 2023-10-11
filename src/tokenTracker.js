class tokenTracker {
  constructor(maxTokens, replenishAmount, replenishTime) {
    this.maxTokens = maxTokens;
    this.replenishAmount = replenishAmount;
    this.replenishTime = replenishTime;
    this.lastUsed = new Date().getTime();
    this.currentTokens = maxTokens - replenishAmount * 3;
    this.reservedTokens = 0;
  }

  hasTokens(amount) {
    if (this.currentTokens - this.reservedTokens >= amount) {
      return true;
    }
    return false;
  }

  useTokens(amount) {
    this.setLastUsed(new Date().getTime());
    this.currentTokens -= amount;
  }

  reserveTokens(amount) {
    if (amount != undefined) {
      this.reservedTokens += amount;
      // console.log("RESERVING TOKENS",this.reservedTokens,amount)
    }
  }

  releaseTokens(amount) {
    if (amount != undefined) {
      this.reservedTokens -= amount;
      // console.log("RELEASING TOKENS",this.reservedTokens,amount)
    }
  }

  updateTokens() {
    var ct = new Date().getTime();
    // console.log([ct,this.lastUsed]);
    // console.log();

    this.setCurrentTokens(
      this.getCurrentTokens() +
        ((ct - this.lastUsed) / this.replenishTime) * this.replenishAmount
    );
    
    // console.log(this.currentTokens,ct,this.lastUsed,((ct - this.lastUsed) / this.replenishTime) * this.replenishAmount)

    if(this.getCurrentTokens()>this.maxTokens){
      this.setCurrentTokens(this.maxTokens)
    }

    // console.log(this.currentTokens,ct,this.lastUsed,((ct - this.lastUsed) / this.replenishTime) * this.replenishAmount)

    this.setLastUsed(ct);
  }

  setLastUsed(time) {
    this.lastUsed = time;
  }

  setCurrentTokens(currentTokens) {
    this.currentTokens = currentTokens;
  }

  getCurrentTokens() {
    return this.currentTokens;
  }
}
module.exports = tokenTracker;
