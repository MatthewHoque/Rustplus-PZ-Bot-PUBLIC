class MaxPriorityQueue {
  constructor() {
    this.pq = []; // Priority queue (binary heap)
    this.entryFinder = {}; // Map to track elements by ID
  }

  addElement(id, priority) {
    if (id in this.entryFinder) {
      this.removeElement(id); // Remove existing element
    }

    const entry = [priority, id];
    this.entryFinder[id] = entry;
    this.pq.push(entry);
    this._heapifyUp();
  }

  removeElement(id) {
    // console.log(this.entryFinder);
    // console.log(this.pq);
    // console.log(id);
    const entry = this.entryFinder[id];
    if (entry != undefined) {
      delete this.entryFinder[id];
      entry[1] = null; // Mark as removed
      this._heapifyDown();
      return entry[0];
    }
  }

  // getHighestPriority() {
  //   if (this.pq.length === 0) {
  //     throw new Error("Priority queue is empty");
  //   }

  //   const [priority, id] = this.pq[0];
  //   delete this.entryFinder[id];
  //   this.pq[0] = this.pq.pop();
  //   this._heapifyDown();
  //   return [id, priority];
  // }

  getHighestPriority() {
    if (this.pq.length == 0) {
      return null;
    }

    if (this.pq.length == 1) {
      const [priority, id] = this.pq[0];
      this.pq = [];
      return [id, priority];
    }

    while (this.pq.length > 0) {
      const [priority, id] = this.pq[0];

      // Check if the element is marked as null
      if (id !== null) {
        delete this.entryFinder[id];
        this.pq[0] = this.pq.pop();
        this._heapifyDown();

        return [id, priority];
      } else {
        // Element is marked as null, ignore and move to the next one
        this.pq[0] = this.pq.pop();
        this._heapifyDown();
        if (this.pq.length == 1) {
          this.pq = [];
          return null;
        }
      }
    }
  }

  peek() {
    if (this.pq.length == 0) {
      return null;
    }

    if (this.pq.length == 1) {
      const [priority, id] = this.pq[0];
      console.log(priority,id)
      if (id == null) {
        this.pq=[]
        return null;
      }
      return [id, priority];
    }

    while (this.pq.length > 0) {
      const [priority, id] = this.pq[0];

      // Check if the element is marked as null
      if (id !== null) {
        return [id, priority];
      } else {
        // Element is marked as null, ignore and move to the next one
        if (this.pq.length == 1) {
          this.pq = [];
          return null;
        }
        this.pq[0] = this.pq.pop();
        this._heapifyDown();
        
      }
    }
  }

  _heapifyUp() {
    let index = this.pq.length - 1;
    while (index > 0) {
      const parentIndex = Math.floor((index - 1) / 2);
      if (this.pq[index][0] > this.pq[parentIndex][0]) {
        [this.pq[index], this.pq[parentIndex]] = [
          this.pq[parentIndex],
          this.pq[index],
        ];
        index = parentIndex;
      } else {
        break;
      }
    }
  }

  _heapifyDown() {
    let index = 0;
    while (true) {
      const leftChildIndex = 2 * index + 1;
      const rightChildIndex = 2 * index + 2;
      let largestChildIndex = index;

      if (
        leftChildIndex < this.pq.length &&
        this.pq[leftChildIndex][0] > this.pq[largestChildIndex][0]
      ) {
        largestChildIndex = leftChildIndex;
      }

      if (
        rightChildIndex < this.pq.length &&
        this.pq[rightChildIndex][0] > this.pq[largestChildIndex][0]
      ) {
        largestChildIndex = rightChildIndex;
      }

      if (largestChildIndex !== index) {
        [this.pq[index], this.pq[largestChildIndex]] = [
          this.pq[largestChildIndex],
          this.pq[index],
        ];
        index = largestChildIndex;
      } else {
        break;
      }
    }
  }
}

module.exports = MaxPriorityQueue;
