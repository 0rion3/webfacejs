export function isBlank(s) {
  return (s == null || s === "");
}

export function isEmpty(s) {
  return s.length == 0;
}

export function isPresent(s) {
  return(s != null && s.length > 0)
}

// If string is passed, splits it into array using , as the delimited
// (removing whitespace), but if Array or Object is passed,
// it returns it as is.
export function string_to_array_or_object(s) {
  if(typeof s === "string") s = s.split(/,\s?/);
  return s;
}

export function hashCode() {
  var hash = 0;
  for (var i = 0; i < this.length; i++) {
    var character = this.charCodeAt(i);
    hash = ((hash<<5)-hash)+character;
    hash = hash & hash; // Convert to 32bit integer
  }
  return hash;
}
