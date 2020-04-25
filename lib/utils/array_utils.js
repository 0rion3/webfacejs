export function uniq(arr, { remove_null=false }={}) {
  if(remove_null)
    arr = arr.filter(i => i != null);
  return Array.from(new Set(arr));
}
export function arraysIntersect(arr1, arr2) {
  var intersection = arr1.filter(value => arr2.includes(value));
  return intersection.length > 0;
}

export function arrayMove(arr, old_index, new_index) {
  if (new_index >= arr.length) {
      var k = new_index - arr.length + 1;
      while (k--) {
          arr.push(undefined);
      }
  }
  arr.splice(new_index, 0, arr.splice(old_index, 1)[0]);
};

export function equals(arr1, arr2, { null_equality=true }={}) {
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
}
