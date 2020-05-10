export { string_utils as default }

var string_utils = {

  isBlank: function(s) {
    return (s == null || s === "");
  },

  isEmpty: function(s) {
    return s.length == 0;
  },

  isPresent: function(s) {
    return(s != null && s.length > 0)
  },

  // If string is passed, splits it into array using , as the delimited
  // (removing whitespace), but if Array or Object is passed,
  // it returns it as is.
  toArrayOrObject: function(s) {
    if(typeof s === "string") s = s.split(/,\s?/);
    return s;
  }

}