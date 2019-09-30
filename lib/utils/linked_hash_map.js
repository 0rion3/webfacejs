export class LinkedHashMap {

  static from(obj) {
    var hash = new LinkedHashMap();
    Object.keys(obj).forEach((k) => {
      hash.addTail(k, obj[k]);
    });
    return hash;
  }

  constructor(max_length=null) {
    this.map  = {};
    this.head = null;
    this.tail = null;
    this.length = 0;
    this.max_length = max_length;
  }

  forEach(callback, self=this) {
    for(let [k,v] of this)
      callback.call(self,k,v);
  }

  get keys() {
    var keys = [];
    this.forEach((k,v) => keys.push(k));
    return keys;
  }

  get values() {
    var values = [];
    this.forEach((k,v) => values.push(v));
    return values;
  }

  get(key) {
    var item = this.map[key] || {};
    return item.value;
  }

  get isEmpty() { return this.keys.length == 0; }

  addHead(key, value) {
    this.remove(key);

    if (this.max_length != null && this.length === this.maxLength)
      this.removeTail();

    var item = {
      key: key,
      prev: null,
      next: this.head,
      value: value
    };
    if (this.head) {
      this.head.prev = item;
    }
    this.head = item;
    if (!this.tail) {
      this.tail = item;
    }
    this.map[key] = item;
    this.length += 1;
  }

  addTail(key, value) {
    this.remove(key);

    if (this.max_length != null && this.length === this.maxLength)
      this.removeHead();

    var item = {
      key: key,
      prev: this.tail,
      next: null,
      value: value
    };
    if (this.tail) {
      this.tail.next = item;
    }
    this.tail = item;
    if (!this.head) {
      this.head = item;
    }
    this.map[key] = item;
    this.length += 1;
  }

  removeTail() {
    if (this.tail) {
      this._removeItem(this.tail);
    }
  }

  removeHead() {
    if (this.head) {
      this._removeItem(this.head);
    }
  }

  sort() {
    // Convert this.map to actual map first
    var map = new Map()
    Object.keys(this.map).forEach(function(k) {
      map.set(k, this.map[k]);
    }, this);

    // Remove all elements from the current hash
    this.clear();

    // And finally replace them with the sorted ones
    new Map([...map.entries()].sort((a, b) => a[1].value.localeCompare(b[1].value))).forEach((v,k) => {
      this.addTail(k,v.value);
    });
  }

  // remove item by key
  remove(key) {
    var item = this.map[key];
    if (!item) return;
    this._removeItem(item);
  }

  clear() {
    this.keys.forEach((k) => this.remove(k), this);
  }

  [Symbol.iterator]() {
    var current_item;
    return {
      next: () => {
        if(current_item == null)
          current_item = this.head;
        else
          current_item = current_item.next;

        if(current_item)
          return { value: [current_item.key, current_item.value] };
        else
          return { done: true };
      }
    }
  }

  // this removes an item from the link chain and updates length/map
  // used by remove() and is not supposed to be used outside of the class.
  _removeItem(item) {
    if (this.head === item) {
      this.head = item.next;
    }
    if (this.tail === item) {
      this.tail = item.prev;
    }
    if (item.prev) {
      item.prev.next = item.next;
    }
    if (item.next) {
      item.next.prev = item.prev;
    }
    delete this.map[item.key];
    this.length -= 1;
  }

};
