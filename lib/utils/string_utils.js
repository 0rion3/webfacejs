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
  },

  parseNumber: function(s) {
    var result;
    if(s.includes("."))// it's a float!
      result = parseFloat(s);
    else // it's an integer!
      result = parseInt(s);

    // But, if the produced number doesn't look exactly like the parsed string,
    // we'll return throw!
    if((result == 0 && s == "0.0") || result.toString() == s) {
      return result;
    } else {
      throw new NumberParsingError(s);
    }

  }

}

class NumberParsingError extends Error {
  constructor(n) {
    super(`Error parsing number '${n}'. It's either too long or something else is wrong!`);
    this.name = "NumberParsingError";
  }
}
