var assert;
export default assert = {
  any      : (v) => true,
  is_null  : (v) => v == null,
  not_null : (v) => v != null,
  is_not   : (v1, v2) => v1 != v2,
  is_in    : (v, keys) => keys.includes(v),
  not_in   : (v, keys) => !keys.includes(v)
}
