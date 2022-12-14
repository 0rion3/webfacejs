import array_utils from './array_utils.js'
import TypeChecker from './type_checker.js'

export { map_utils as default }
const map_utils = {

  object_to_map: function(obj) {
    var map = new Map();
    Object.keys(obj).forEach(function(k) {
      if(TypeChecker.isSimpleObject(obj[k]))
        obj[k] = map_utils.object_to_map(obj[k]);
      map.set(k, obj[k]);
    });
    return map;
  },

  merge: function(map1, map2, { deep=false }={}) {

    if(TypeChecker.isSimpleObject(map1))
      map1 = map_utils.object_to_map(map1);
    if(TypeChecker.isSimpleObject(map2))
      map2 = map_utils.object_to_map(map2);

    map2.forEach(function(v,k) {
      if(deep && map1.get(k) instanceof Map && v instanceof Map)
        map1.set(k, map_utils.merge(map1.get(k), v, { deep: true }));
      else
        map1.set(k, v);
    });
    return map1;
  },

  cast_values: function(map) {
    var new_map;

    // convert Object to Map
    if(map.constructor.name == "Object") {
      map = map_utils.object_to_map(map);
      new_map = {};
    } else {
      new_map = new Map();
    }

    var num_regexp = /^\d+\.?\d*$/;
    map.forEach((v,k) => {
      if(typeof v == "string" && num_regexp.test(v))
        v = Number(v);
      else if(v.constructor.name == "Object" || v instanceof Map)
        v = castMapValues(v);
      new_map instanceof Map ? new_map.set(k,v) : new_map[k] = v;
    });
    return new_map;
  },

  // TODO: support deep checking for Objects and maps
  // Currently, unless all values in the map/object are simple ones or Arrays, it will return false
  compare: function(map1, map2) {

    if(!(map1 instanceof Map))
      map1 = map_utils.object_to_map(map1);
    if(!(map2 instanceof Map))
      map2 = map_utils.object_to_map(map2);

    var has_all_keys_and_values = true;
    map1.forEach((v,k) => {
      let map2_value = map2.get(k);
      if(map2_value && map2_value.constructor === Array && v.constructor === Array) {
        if(!array_utils.equals(map2_value, v))
          has_all_keys_and_values = false
      } else if(map2_value != v) {
        has_all_keys_and_values = false
      }
    });
    map2.forEach((v,k) => {
      let map1_value = map1.get(k);
      if(map1_value && map1_value.constructor === Array && v.constructor === Array) {
        if(array_utils.equals(map1_value, v) == false)
          has_all_keys_and_values = false
      } else if(map1_value != v) {
        has_all_keys_and_values = false
      }
    });
    return has_all_keys_and_values;
  }

}
