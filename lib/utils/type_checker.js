export class TypeChecker {

  // Checks whether something is a hash (in Ruby terminology), but at the same
  // time isn't another object such as an Array. Javascript doesn't really distinguish between those,
  // and we're not comfortable using Map() all the time due to a more complex syntax of defining maps.
  static isSimpleObject(obj) {
    if(obj != null && (typeof obj == "object") && obj.constructor.name == "Object")
      return true;
    else
      return false;
  }

  // Checks whether object class inheritance line has a particular mixin in it
  // Note that `mixin_name` argument should be a string.
  static hasMixin(obj, mixin_name) {
    var class_obj = obj.constructor;
    while(class_obj != null && class_obj.name != "Object") {
      let has_mixin = this.classHasMixin(class_obj, mixin_name);
      class_obj = Object.getPrototypeOf(class_obj);
      if(has_mixin) return true;
    }
    return false;
  }

  // Checks whether a class object has a particular mixin somewhere it its inheritance line.
  // Is used by hasMixin(). Note that `mixin_name` argument should be a string.
  static classHasMixin(class_obj, mixin_name) {
    function collect_mixins(mixins) {
      var nested_mixins = mixins;
      if(mixins != null) {
        mixins.forEach(function(m) {
          if(window.global_mixin_inheritance_tree[m] != null) {
            nested_mixins = new Set([...mixins, ...(collect_mixins(window.global_mixin_inheritance_tree[m]))]);
          }
        });
      }
      return nested_mixins;
    }
    
    if(typeof mixin_name != "string")
      mixin_name = mixin_name.name;

    var mixins = window.global_mixin_inheritance_tree[class_obj.name];
    if(mixins == null) return false; // Key doesn't exist, this mixin was never mixed into anything!
    
    return collect_mixins(mixins).has(mixin_name);
  }

}
