export function uniq(arr) {
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
