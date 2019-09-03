window.global_mixin_inheritance_tree = {};

export function extend_as(class_name) {

  var mix    = function(superclass) { return new MixinBuilder(superclass, class_name); }
  var mixins = function(...mixins)  { return mix(Object).with(...mixins);  }
  return { "mix": mix, "mixins" : mixins }

}

class MixinBuilder {
  constructor(superclass, current_class_name=null) {
    this.superclass = superclass;
    this.current_class_name = current_class_name;
  }

  with(...mixins) {
    this._logInheritance(mixins);
    return mixins.reduce((c, mixin) => mixin(c), this.superclass);
  }

  _logInheritance(mixins) {

    if(this.current_class_name == null) return;

    var mixins_set = new Set();
    mixins.forEach((m) => mixins_set.add(m.name), this);
    window.global_mixin_inheritance_tree[this.current_class_name] = mixins_set;

  }

}
