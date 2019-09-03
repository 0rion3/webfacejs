export const Validatable = (Validatable) => class extends Validatable {

  constructor() {

    super();

    this.valid = true;

    /// Stores all the validations. This variable should be redefined by you
    /// in every class you include the 'Validatable' module into.
    this.validations = {}

    /// Stores all the validation errors. Is filled automatically after
    /// the `validate()` method is run.
    this.validation_errors = {}
  }

  /**
    Runs all the validations against the attributes.
  */
  validate() {

    this.valid = true;

    // remove previous validation errors
    this.validation_errors = {};

    for(let field_name in this.validations) {
      
      // Ignores validation if it contains a . (dot) which means it's a descendant validation
      if(field_name.includes(".")) continue;

      // Skip if field allows null and value is null
      if(this.validations[field_name]["allow_null"] && this.get(field_name) == null) continue;

      let field_validations = this.validations[field_name];

      if(this.validation_errors[field_name] == null)
        this.validation_errors[field_name] = [];

      // We can pass a custom object in which the validation
      // function is called. Otherwise, it's called on the
      // the current object.
      var validator;
      if(Object.keys(field_validations).includes("object"))
        validator = field_validations["object"];
      else
        validator = this;

      field_validations_loop: for(let v_name in field_validations) {

        let v_arg = field_validations[v_name];

        // not a validation, here, ignore!
        if(v_name == "object") continue field_validations_loop;

        if(typeof v_arg != "object" || v_arg instanceof Array || v_arg instanceof RegExp)
          v_arg = { 'value': v_arg, 'message': null };

        if(v_name == 'function') {
          let validation_object;
          if(Object.keys(field_validations).includes("object")) // custom validation function in a separate object
            validation_object = field_validations["object"];
          else // custom validation function in the same object
            validation_object = this;

          // calling custom validation function
          if(!validation_object["_" + field_validations["function"]["name"]](this.get(field_name)))
            this.validation_errors[field_name].push(this._getValidationErrorMessage(`wrong value in ${field_name}`, v_arg));
        // Existing validation method.
        } else {
          if(Reflect.has(this, `_validate_${v_name}`))
            this[`_validate_${v_name}`](field_name, v_arg);
          else if(this.parent && Reflect.has(this.parent, `_validate_${v_name}`))
            this.parent[`_validate_${v_name}`].apply(this, [field_name, v_arg]);
          else if(v_name != "allow_null")
            throw(`${this.constructor.name} has no instance method '_validate_${v_name}`);
        }

      }
    }

    for(let field_name in this.validation_errors) {
      let errors = this.validation_errors[field_name]
      if(errors.length > 0) {
        this.valid = false;
        return;
      }
    }

  }

  /* NUMERIC VALIDATIONS */

  _validate_isNumeric(field_name, v) {
    var field_value = this.get(field_name)
    if(field_value == null || typeof field_value == "number") return;

    var result = /^\d+$/.test(field_value);
    if(!result && v['value'])
      this.validation_errors[field_name].push(this._getValidationErrorMessage('is not a number', v));
    else if(result && !v['value'])
      this.validation_errors[field_name].push(this._getValidationErrorMessage('is a number, but it shouldn\'t be', v));
  }

  _validate_isLessThan(field_name, v) {
    var field_value = this.get(field_name);
    if(field_value == null || this._getNumericValue(field_value) >= v['value'])
      this.validation_errors[field_name].push(this._getValidationErrorMessage(`should be less than ${v['value']}`, v));
  }
  _validate_isMoreThan(field_name, v) {
    var field_value = this.get(field_name);
    if(field_value == null || this._getNumericValue(field_value) <= v['value'])
      this.validation_errors[field_name].push(this._getValidationErrorMessage(`should be more than ${v['value']}`, v));
  }


  /* ENUM VALIDATIONS */

  _validate_isOneOf(field_name, v) {
    if(!this._checkIsOneOf(field_name, v['value']))
      this.validation_errors[field_name].push(this._getValidationErrorMessage(`should be one of the following: ${v['value'].join(', ')}`, v));
  }
  _validate_isNotOneOf(field_name, v) {
    if(this._checkIsOneOf(field_name, v['value']))
      this.validation_errors[field_name].push(this._getValidationErrorMessage(`should NOT be one of the following: ${v['value'].join(', ')}`, v));
  }


  /* STRING VALIDATIONS */

  _validate_isLongerThan(field_name, v) {
    var field_value = this.get(field_name);
    if(field_value == null || field_value.length <= v['value'])
      this.validation_errors[field_name].push(this._getValidationErrorMessage(`should be longer than ${v['value']}`, v));
  }

  _validate_isShorterThan(field_name, v) {
    var field_value = this.get(field_name);
    if(field_value == null || field_value.length >= v['value'])
      this.validation_errors[field_name].push(this._getValidationErrorMessage(`should be shorter than ${v['value']}`, v));
  }

  _validate_hasExactLengthOf(field_name, v) {
    var field_value = this.get(field_name);
    if(field_value == null || field_value.length != v['value'])
      this.validation_errors[field_name].push(this._getValidationErrorMessage(`should have the length of ${v['value']}`, v));
  }

  _validate_matches(field_name, v) {
    var field_value = this.get(field_name);
    if(field_value == null || !(v['value'].test(field_value)))
      this.validation_errors[field_name].push(this._getValidationErrorMessage('has wrong format', v));
  }

  _validate_isNotNull(field_name, v) {
    var field_value = this.get(field_name);
    if(field_value == null)
      this.validation_errors[field_name].push(this._getValidationErrorMessage('should not be null', v));
  }

  _validate_isNotEmpty(field_name, v) {
    var field_value = this.get(field_name);
    if(field_value == null)
      return;
    else if(field_value.length == 0)
      this.validation_errors[field_name].push(this._getValidationErrorMessage('should not be empty', v));
  }


  /* UTILITY METHODS */

  _getValidationErrorMessage(default_message, v=null) {
    return v['message'] == null ? default_message : v['message'];
  }

  _checkIsOneOf(field_name, v) {
    return v.includes(this.get(field_name));
  }

  _getNumericValue(v) {
    if(typeof v == "string")
      return parseFloat(v);
    else
      return v;
  }

}
