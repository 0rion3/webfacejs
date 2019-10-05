import { extend_as } from '../utils/mixin.js'
import { FormFieldComponent } from '../components/form_field_component.js'

/** This is a basic component for form fields, from which most other form field components should inherit.
  * The important thing that it does, it defines a `value_holder` concept - a part inside the DOM-structure
  * that actually holds the value (an input) and is being submitted when the form is submitted.
  *
  * Attributes description:
  *
  *   * `validation_errors_summary` - validations errors are dumped there as text;
  *                                   Have a attr element in the DOM structure to display them automatically.
  *   * `name`                      - name of the http param that's being sent to the server.
  *   * `disabled`                  - if set to true, the UI element doesn't respond to any input/events.
  *
  */
export class NumericFormFieldComponent extends extend_as("NumericFormFieldComponent").mix(FormFieldComponent).with() {

  constructor() {
    super();
    this.attribute_names.push("max_length", "max_integer_length", "max_decimal_length");
    this.attribute_callbacks[this.value_attr] = (attr_name, self) => {
      self._writeAttrToNode(attr_name, self.get(attr_name));
      this.set(this.value_attr, self._set_number_value(self.get(self.value_attr)), { run_callback: false });
      self.publishEvent("change", { "component": this, "event": self });
    };
  }

  afterInitialize() {
    super.afterInitialize();
    this.updateAttrsFromNodes({ attrs: ["disabled", "name", "max_length", "max_integer_length", "max_decimal_length"], invoke_callbacks: true });
  }

  /** This method (a reload of the attribute setter)
    * makes sure we only allow digits and period (.) in to be entered into the field.
    * If a user enters some other character it is immediately erased.
    *
    * Additionally, it makes sure the length of the field does not exceed
    * the value in the #max_length attr.
    */
  _set_number_value(v) {

    if(this._isMaxLengthReached(v)) {
      if(this._isMaxLengthReached(this.previous_value))
        return null;
      else
        return this.previous_value || null;
    } else if(typeof v === "string") {

      var numeric_regexp = /^(\d|\.)*$/;
      if(numeric_regexp.test(v)) {

        // Handling the case with two decimal points - let's not allow that
        // and revert to the previous value.
        var decimal_points_regexp = /\./g;
        let regexp_result = v.match(decimal_points_regexp);
        if(regexp_result != null && regexp_result.length >= 2)
          return this.previous_value || null;
        // Ingore if there's just a decimal point and nothing else.
        else if(v == ".")
          return null;
        else {
          if(v.startsWith("."))
            return parseFloat(`0${v}`);
          else if(v != null && v.length > 0)
            return parseFloat(v);
          else
            return null;
        }

      } else {
        if(this.get("value") != null)
          return this.previous_value || null;
        else
          return null;
      }

    } else if (typeof v === "number") {
      return v;
    }
  }

  _updateValueFromDom({ event=null }={}) {
    // Callback is set to `false` here because we don't need to update the value_attr
    // of the value_holder element after we've just read the actual value from it. That results in a loop
    // we don't want to have!
    this.updateAttrsFromNodes({ attrs: [this.value_attr], run_callback: false });
    this.set(this.value_attr, this._set_number_value(this.get(this.value_attr)));
  }

  _isMaxLengthReached(v) {
    if(!v) v = "";
    v = v.toString();
    return (
      (this.get("max_length") != null && v.length > this.get("max_length")) ||
      this._isMaxIntegerLengthReached(v)                                    ||
      this._isMaxDecimalLengthReached(v)
    );
  }

  _isMaxIntegerLengthReached(v) {
    return (this.get("max_integer_length") != null && v.split(".")[0].length > this.get("max_integer_length"));
  }

  _isMaxDecimalLengthReached(v) {
    return (this.get("max_decimal_length") != null && v.split(".")[1] != null && v.split(".")[1].length > this.get("max_decimal_length"));
  }

}
window.webface.component_classes["NumericFormFieldComponent"] = NumericFormFieldComponent;
