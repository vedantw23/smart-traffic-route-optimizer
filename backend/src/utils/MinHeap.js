export default class MinHeap {
  constructor(compare = (first, second) => first - second) {
    this.items = [];
    this.compare = compare;
  }

  get size() { return this.items.length; }
  isEmpty() { return this.items.length === 0; }
  peek() { return this.items[0]; }

  insert(value) {
    this.items.push(value);
    this.#bubbleUp(this.items.length - 1);
  }

  extractMin() {
    if (this.items.length === 0) return undefined;
    const minimum = this.items[0];
    const last = this.items.pop();
    if (this.items.length > 0) {
      this.items[0] = last;
      this.#bubbleDown(0);
    }
    return minimum;
  }

  #bubbleUp(index) {
    while (index > 0) {
      const parent = Math.floor((index - 1) / 2);
      if (this.compare(this.items[index], this.items[parent]) >= 0) break;
      [this.items[index], this.items[parent]] = [this.items[parent], this.items[index]];
      index = parent;
    }
  }

  #bubbleDown(index) {
    while (true) {
      const left = (index * 2) + 1;
      const right = left + 1;
      let smallest = index;
      if (left < this.items.length && this.compare(this.items[left], this.items[smallest]) < 0) smallest = left;
      if (right < this.items.length && this.compare(this.items[right], this.items[smallest]) < 0) smallest = right;
      if (smallest === index) return;
      [this.items[index], this.items[smallest]] = [this.items[smallest], this.items[index]];
      index = smallest;
    }
  }
}
