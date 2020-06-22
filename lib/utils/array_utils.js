export { array_utils as default }
export const array_utils = {

  uniq: function(arr, { remove_null=false }={}) {
    if(remove_null)
      arr = arr.filter(i => i != null);
    return Array.from(new Set(arr));
  },

  intersect: function(arr1, arr2) {
    var intersection = arr1.filter(value => arr2.includes(value));
    return intersection.length > 0;
  },

  move: function(arr, old_index, new_index) {
    if (new_index >= arr.length) {
        var k = new_index - arr.length + 1;
        while (k--) {
            arr.push(undefined);
        }
    }
    arr.splice(new_index, 0, arr.splice(old_index, 1)[0]);
  },

  equals: function(arr1, arr2, { null_equality=true }={}) {
    // if the other arr2 is a falsy value, return
    if(!arr2)
      return false;

    // compare lengths - can save a lot of time
    if(arr1.length != arr2.length)
      return false;

    for(let i=0, l=arr1.length; i < l; i++) {
      // Check if we have nested arr2s
      if(arr1[i] instanceof Array && arr2[i] instanceof Array) {
        // recurse into the nested arr2s
        if(!arr1[i].equals(arr2[i]))
          return false;
      } else if(null_equality && arr1[i] == null && arr2[i] == null) {
        return true;
      }
      else if(arr1[i] != arr2[i]) {
        // Warning - two different object instances will never be equal: {x:20} != {x:20}
        return false;
      }
    }
    return true;
  },

  subtract: function(arr1, arr2, test_function) {
    arr1.filter((i) => !arr2.includes(i))
  },


  // Some browsers don't support Array.flat() yet, so we have to implement it.
  flat: function(depth=1) {
    return this.reduce(function (flat, to_flatten) {
      return flat.concat((Array.isArray(to_flatten) && (depth>1)) ? to_flatten.flat(depth-1) : to_flatten);
    }, []);
  }

}

if(!Array.prototype.flat) {
  Object.defineProperty(Array.prototype, 'flatten', array_utils.flat);
}
