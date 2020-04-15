export function uniq(arr) {
  return Array.from(new Set(arr));
}
export function arraysIntersect(arr1, arr2) {
  var intersection = arr1.filter(value => arr2.includes(value));
  return intersection.length > 0;
}
