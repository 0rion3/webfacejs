/**
  * Allows you to easily define getters/setters for attributes on your class
  * and invoke callbacks when those attributes change.
  *
  * Please see README for explanation and code samples and ../examples/ for 
  * an example of a class that employs attributable.
  */
export const Attributable = (Attributable) => class extends Attributable {

  constructor() {

    super();

    // A Map of all the callbacks for the attributes that are invoked when an attribute changes.
    this.attribute_callbacks = {};

    // Attributes names and values for them, stored as a map. Do not fuck with this
    // attr. Read from it, but don't write.
    this.attributes = {};

    // Previous attribute values end up here. Useful to find out whether something has changed.
    this.attribute_old_values = {};

    // This attr defines which attributes get to be attributes: they will have defined
    // getters and setters for them.
    this.attribute_names = [];

    // Sometimes we want to set attributes to their default value.
    // the #setDefaultAttributeValues does exactly for each attribute name and value listed
    // in this attr.
    this.default_attribute_values = {};

  }

  get(name) {
    var old = false;
    if(name.startsWith("_old_")) {
      name = name.replace("_old_", "");
      old  = true;
    }

    this._attrExistsOrThrow(name);
    if(old)
      return this.attribute_old_values[name]
    else {
      if(typeof this[`_get_attr_${name}`] === "function")
        return this[`_get_attr_${name}`]();
      else
        return this.attributes[name];
    }
  }

  set(name, value, { run_callback=true, raise_if_undefined=true, force_callback=false }={}) {

    if(raise_if_undefined)
      this._attrExistsOrThrow(name);
    else
      if(!(this.attribute_names.includes(name))) return;

    this.attribute_old_values[name] = this.attributes[name];

    if(typeof this[`_set_attr_${name}`] === "function")
      this[`_set_attr_${name}`](value);
    else
      this.attributes[name] = value;

    if((run_callback && this.hasAttributeChanged(name)) || force_callback)
      this.invokeAttributeCallback(name);
  }

  /**
   * Same as set(), but doesn't raise UndefinedAttributeError if attribute doesn't exist
   */
  setIfExists(name, value, { run_callback=true }={}) {
    return this.set(name, value, { raise_if_undefined: false, run_callback: run_callback });
  }

  /**
   * Invokes a callback for a given attribute. If no callback for that specific attribute is defined,
   * invokes a callback named `default` (if that one is defined, of course).
   */
  invokeAttributeCallback(name) {
    this._attrExistsOrThrow(name);
    if(this.attribute_callbacks[name] != null) {
      this.attribute_callbacks[name](name, this);
    } else if(this.attribute_callbacks['default'] != null) {
      this.attribute_callbacks['default'](name, this);
    }
  }

  /**
   * Checks whether a given attribute had a previous value different from the current one.
   */
  hasAttributeChanged(name) {
    this._attrExistsOrThrow(name);
    return !(this.attributes[name] == this.attribute_old_values[name]);
  }

  /**
   * Updates registered attributes with values provided, then run callbacks on them.
   * Optionally, one can provide a function to be run after the attributes
   * are set (`callback` attribute). If this function evalutes to false, no callbacks
   * would be run (useful in validations).
   *
   * If ignore_non_existent is set to true, it will not raise error while trying
   * to update non-existent attributes.
   */
  updateAttributes(names_and_values, { callback=true, ignore_non_existent=false } = {}) {
    for(let k in names_and_values) {
      if(!k.includes(".") && (this.attribute_names.includes(k) || ignore_non_existent == false))
        this.updateAttribute(k, names_and_values[k], callback);
    }
  }

  updateAttribute(name, value, { callback=true }={}) {
    var run_callback;
    if(typeof callback === "boolean")
      run_callback = callback;
    else
      run_callback = callback();

    if(this.attribute_names.includes(name))
      this.set(name, value, { run_callback: run_callback });
    else
      throw new UndefinedAttributeError(`Attribute \`${name}\` doesn't exist`);
  }

  setDefaultAttributeValues() {
    for(let k in this.default_attribute_values) {
      if(this.attributes[k] === undefined)
        this.attributes[k] = this.default_attribute_values[k];
    }
  }

  _attrExistsOrThrow(name) {
    if(!(this.attribute_names.includes(name)))
      throw new UndefinedAttributeError(`Attribute \`${name}\` doesn't exist`);
  }

}

export class UndefinedAttributeError extends Error {}
