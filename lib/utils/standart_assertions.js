export const any      = (v) => true;
export const is_null  = (v) => v == null;
export const not_null = (v) => v != null;
export const is_not   = (v1, v2) => v1 != v2;
export const is_in    = (v, keys) => keys.includes(v);
export const not_in   = (v, keys) => !keys.includes(v);
