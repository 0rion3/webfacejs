import TypeChecker from '../utils/type_checker.js'

export { ComponentValidation as default }
export const ComponentValidation = (ComponentValidation) => class extends ComponentValidation {

  constructor() {
    super();
    this.descendant_validations = {};
    this.validation_errors_summary = "";
  }

  afterInitialize() {
    if(this.parent != null) this.parent.separateDescendantValidations();
    this._addValidationsFromParent();
  }

  validate({ deep=true }={}) {

    super.validate();

    if(!this.valid) {
      var validation_errors_summary_array = [];
      Object.keys(this.validation_errors).forEach(function(ve) {
        validation_errors_summary_array.push(`${this.validation_errors[ve].join('; ')}`);
      }, this);
      this.setIfExists("validation_errors_summary", validation_errors_summary_array.join(', '));
    } else {
      this.setIfExists("validation_errors_summary", null);
    }

    if(deep) {
      this.children.forEach((c) => {
        if(!c.validate({ deep: true }))
          if(this.valid == true) this.valid = false;
      }, this);
    }
    this.valid ? this.behave('hideErrors') : this.behave('showErrors');
    return this.valid;
  }

  clearValidations({ deep=true }={}) {
    super.clearValidations();
    this.validation_errors_summary = "";
    this.validation_errors_summary_array = [];
    this.behave("hideErrors");
    if(deep) {
      this.children.forEach((c) => {
        if(!c.valid) c.clearValidations()
      }, this);
    }
  }

  /** Adds validations to children by looking at #descendants_validations.
    * Worth noting that if one of the validation keys contains more than one dot (.)
    * it means that this validation is for one of the child's children and it gets added
    * to child's #descendant_validations, not to #validations.
    */
  addValidationsToChild(c) {
    if(!this.children.includes(c))
      throw new NoChildForValidations(`No child ${c.constructor.name} found among the children of ${this.constructor.name} when adding descendant validations.`)
    Object.keys(this.descendant_validations).forEach(function(dr) {
      let dr_map = dr.split('.');
      let r      = dr_map.shift();
      if(c.roles.includes(r)) {

        let validation = this.descendant_validations[dr];
        if(Object.keys(validation).includes('function'))
          validation["object"] = this;

        if(dr_map.length > 1)
          c.descendant_validations[dr_map.join('.')] = validation;
        else
          c.validations[dr_map[0]] = validation;
      }
    }, this);
  }

  /** Extracts validations with keys containing dots .
    * as those are validations defined for descendants.
    */
  separateDescendantValidations() {
    if(this.descendant_validations && this.descendant_validations.keys && this.descendant_validations.keys.length > 0) return;
    Object.keys(this.validations).forEach(function(k) {
      if(k.includes('.'))
        this.descendant_validations[k] = this.validations[k];
    }, this);
    Object.keys(this.descendant_validations).forEach((k) => delete this.validations[k], this);
  }

  _addValidationsFromParent() {
    if(this.parent != null)
      this.parent.addValidationsToChild(this);
  }

  /** Adds translated validation error messages for those fields where
    * validations are defined with i18n_message option.
    * Example:

    * this.validations = {
    *   'contract_value_input.value' : { 'function' : { 'name': 'validateAmountMatchesOffer',     'i18n_message': "OfferComponent.should_be_within_volume_range" }},
    *   'contract_volume'            : { 'function' : { 'name': 'validateVolumeIsAboveThreshold', 'i18n_message': "OfferComponent.volume_below_threshold"        }},
    *   'contract_volume'            : { 'isMoreThan' : { 'value': 1, 'i18n_message': "OfferComponent.hello_world" }}
    * };
    */
  _i18nize_validation_messages() {
    for(let field_name in this.validations) {
      let field_validations = this.validations[field_name];

      for(let k in field_validations) {
        let v = field_validations[k];

        if(TypeChecker.isSimpleObject(v) && Object.keys(v).includes("i18n_message")) {
          var i18n_key = v["i18n_message"].split(".");
          var component_name = i18n_key.shift();
          this.validations[field_name][k]["message"] = this.t(`validations.${i18n_key.join(".")}`, null, component_name);
        }

      }

    }
  }

}

export class NoChildForValidations extends Error {}
