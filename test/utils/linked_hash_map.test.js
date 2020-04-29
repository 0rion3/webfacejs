import '../webface_init.js'
import LinkedHashMap from '../lib/utils/linked_hash_map.js'

describe("LinkedHashMap", function() {

  var hash;

  beforeEach(function() {
    hash = new LinkedHashMap();
  });

  it("adds keys to the head", function() {
    hash.addHead("key1", 1);
    chai.expect(hash.head.value).to.equal(1);
    chai.expect(hash.tail.value).to.equal(1);
    hash.addHead("key2", 2);
    chai.expect(hash.head.value).to.equal(2);
    chai.expect(hash.tail.value).to.equal(1);
    hash.addHead("key3", 3);
    chai.expect(hash.head.value).to.equal(3);
    chai.expect(hash.tail.value).to.equal(1);
  });

  it("adds keys to the tail", function() {
    hash.addTail("key1", 1);
    chai.expect(hash.head.value).to.equal(1);
    chai.expect(hash.tail.value).to.equal(1);
    hash.addTail("key2", 2);
    chai.expect(hash.head.value).to.equal(1);
    chai.expect(hash.tail.value).to.equal(2);
    hash.addTail("key3", 3);
    chai.expect(hash.head.value).to.equal(1);
    chai.expect(hash.tail.value).to.equal(3);
  });

  it("adds items from an object passed to it", function() {
    var hash = LinkedHashMap.from({ key1: 1, key2: 2, key3: 3 });
    chai.expect(hash.keys).to.eql(["key1", "key2", "key3"]);
    chai.expect(hash.values).to.eql([1, 2, 3]);
  });

  it("sorts a LinkedHashMap returning a new one", function() {
    var hash = LinkedHashMap.from({ key1: "b", key2: "c", key3: "a" });
    hash.sort();
    chai.expect(hash.values).to.eql(["a", "b", "c"]);
  });

  describe("iterating", function() {

    beforeEach(function() {
      hash.addTail("key1", 1);
      hash.addTail("key2", 2);
      hash.addTail("key3", 3);
    });

    it("iterates over all the items with for-of", function() {
      var result = [];
      for(let [k,v] of hash)
        result.push([k,v]);
      chai.expect(result).to.eql([["key1", 1], ["key2", 2], ["key3", 3]]);
    });


    it("iterates over all the items with forEach() method", function() {
      var result = [];
      hash.forEach((k,v) => {
        result.push([k,v]);
      });
      chai.expect(result).to.eql([["key1", 1], ["key2", 2], ["key3", 3]]);
    });

  });

  describe("removing items", function() {

    beforeEach(function() {
      hash.addTail("key1", 1);
      hash.addTail("key2", 2);
      hash.addTail("key3", 3);
    });

    it("removes a particular key", function() {
      hash.remove("key3");
      chai.expect(hash.head.value).to.equal(1);
      chai.expect(hash.tail.value).to.equal(2);
    });

    it("removes head", function() {
      hash.removeHead();
      chai.expect(hash.head.value).to.equal(2);
      chai.expect(hash.tail.value).to.equal(3);
    });

    it("removes tail", function() {
      hash.removeTail();
      chai.expect(hash.head.value).to.equal(1);
      chai.expect(hash.tail.value).to.equal(2);
    });

  });



});
