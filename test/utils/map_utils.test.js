import map_utils from '../lib/utils/map_utils.js'

describe("map_utils", function() {

  it("converts object and its nested objects into a map", function() {
    var obj = { "hello" : "world", "nested" : { "level2": "hello2", "level2a": ["hello", "world"], "nested" : { "level3" : 1 }}}
    var result = map_utils.object_to_map(obj);
    chai.expect(result.get("nested")).to.be.instanceof(Map);
    chai.expect(result.get("nested").get("nested")).to.be.instanceof(Map);
    chai.expect(typeof result.get("nested").get("nested").get("level3")).to.equal("number")
    chai.expect(result.get("nested").get("level2a")).to.be.instanceof(Array);
  });

  it("merges two maps recursively", function() {
    var obj1 = { "hello" : "world", "nested1" : { "level2": "hello2", "level2a": ["hello", "world"], "nested2" : { "level3" : 1 }}}
    var obj2 = { "hello" : "world", "nested1" : { "level2": "hello2", "level2a": ["hello", "world"], "key": "just_a_key", "nested2" : { "ok" : "ok" }}}
    var map1 = map_utils.object_to_map(obj1);
    var map2 = map_utils.object_to_map(obj2);
    var result = map_utils.merge(map1, map2, { deep: true });

    chai.expect(result.get("nested1").get("nested2").get("level3")).to.equal(1);
    chai.expect(result.get("nested1").get("key")).to.equal("just_a_key");
  });

  it("casts Object/Map key values to the types that resemble the string value", function() {
    var obj           = { "key1" : "value1", "key2": "2", "key3" : "1.23", "key4": true };
    var converted_obj = { "key1" : "value1", "key2": 2, "key3" : 1.23, "key4": true };
    var map           = map_utils.object_to_map(obj);
    var converted_map = map_utils.object_to_map(converted_obj);
    chai.expect(map_utils.cast_values(obj)).to.eql(converted_obj);
    chai.expect(map_utils.compare(map_utils.cast_values(map), converted_map)).to.be.true;
  });
  
  it("compares two maps/objects", function() {
    var obj1 = { "key1" : "value1", "key2": "2", "key3" : "1.23", "key4": true };
    var obj2 = { "key1" : "value1", "key2": "2", "key3" : "1.23", "key4": false };

    chai.expect(map_utils.compare(obj1, obj2)).to.be.false;
    obj2["key4"] = true;
    chai.expect(map_utils.compare(obj1, obj2)).to.be.true;
    obj2["key4"] = false;

    var map1 = map_utils.object_to_map(obj1);
    var map2 = map_utils.object_to_map(obj2);
    chai.expect(map_utils.compare(map1, map2)).to.be.false;
    map2.set("key4", true);
    chai.expect(map_utils.compare(map1, map2)).to.be.true;

  });

  it("compares two objects with arrays", function() {
    var arr1 = { "key1": ["a", "b"]      };
    var arr2 = { "key1": ["a", "b"]      };
    var arr3 = { "key1": ["a", "c"]      };
    var arr4 = { "key1": ["a", "b", "c"] };

    chai.expect(map_utils.compare(arr1, arr2)).to.be.true;
    chai.expect(map_utils.compare(arr1, arr3)).to.be.false;
    chai.expect(map_utils.compare(arr1, arr4)).to.be.false;
  });
  
});
