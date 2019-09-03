import { object_to_map, merge_maps, cast_map_values, compare_maps } from "../lib/utils/map_utils.js"

describe("map_utils", function() {

  it("converts object and its nested objects into a map", function() {
    var obj = { "hello" : "world", "nested" : { "level2": "hello2", "level2a": ["hello", "world"], "nested" : { "level3" : 1 }}}
    var result = object_to_map(obj);
    chai.expect(result.get("nested")).to.be.instanceof(Map);
    chai.expect(result.get("nested").get("nested")).to.be.instanceof(Map);
    chai.expect(typeof result.get("nested").get("nested").get("level3")).to.equal("number")
    chai.expect(result.get("nested").get("level2a")).to.be.instanceof(Array);
  });

  it("merges two maps recursively", function() {
    var obj1 = { "hello" : "world", "nested1" : { "level2": "hello2", "level2a": ["hello", "world"], "nested2" : { "level3" : 1 }}}
    var obj2 = { "hello" : "world", "nested1" : { "level2": "hello2", "level2a": ["hello", "world"], "key": "just_a_key", "nested2" : { "ok" : "ok" }}}
    var map1 = object_to_map(obj1);
    var map2 = object_to_map(obj2);
    var result = merge_maps(map1, map2, { deep: true });

    chai.expect(result.get("nested1").get("nested2").get("level3")).to.equal(1);
    chai.expect(result.get("nested1").get("key")).to.equal("just_a_key");
  });

  it("casts Object/Map key values to the types that resemble the string value", function() {
    var obj           = { "key1" : "value1", "key2": "2", "key3" : "1.23", "key4": true };
    var converted_obj = { "key1" : "value1", "key2": 2, "key3" : 1.23, "key4": true };
    var map           = object_to_map(obj);
    var converted_map = object_to_map(converted_obj);
    chai.expect(cast_map_values(obj)).to.eql(converted_obj);
    chai.expect(compare_maps(cast_map_values(map), converted_map)).to.be.true;
  });
  
  it("compares two maps/objects", function() {
    var obj1 = { "key1" : "value1", "key2": "2", "key3" : "1.23", "key4": true };
    var obj2 = { "key1" : "value1", "key2": "2", "key3" : "1.23", "key4": false };

    chai.expect(compare_maps(obj1, obj2)).to.be.false;
    obj2["key4"] = true;
    chai.expect(compare_maps(obj1, obj2)).to.be.true;
    obj2["key4"] = false;

    var map1 = object_to_map(obj1);
    var map2 = object_to_map(obj2);
    chai.expect(compare_maps(map1, map2)).to.be.false;
    map2.set("key4", true);
    chai.expect(compare_maps(map1, map2)).to.be.true;

  });
  
});
