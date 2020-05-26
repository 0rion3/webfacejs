var assert;
export default assert = {
  any       : (v)       => true,
  is_null   : (v)       => v == null,
  not_null  : (v)       => v != null,
  is_not    : (v1,v2)   => v1 != v2,
  not       : (v1,v2)   => v1 != v2,
  eq        : (v1,v2)   => v1 == v2,
  more_than : (v1,v2)   => v1 > v2,
  less_than : (v1,v2)   => v1 < v2,

  is_in: (v, keys) => {
    if(typeof keys === "string") keys = [keys];
    return keys.includes(v);
  },
  not_in: (v, keys) => !assert.is_in(v,keys)
}
