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
  _set_attr_value(v) {

    if(typeof v === "string") {

      var numeric_regexp = /^(\d|\.)*$/;
      if(numeric_regexp.test(v) && !(this._isMaxLengthReached(v))) {

        // Handling the case with two decimal points - let's not allow that
        // and revert to the previous value.
        var decimal_points_regexp = /\./g;
        let regexp_result = v.match(decimal_points_regexp);
        if(regexp_result != null && regexp_result.length >= 2) {
          this.setValueForValueHolderElement(this.previous_value);
        }
        // Ingore if there's just a decimal point and nothing else.
        else if(v == ".") {
          this.attributes["value"] = null;
        }

        else {
          if(v.startsWith(".")) {
            this.value_holder_element.value = `0${v}`;
            this.attributes["value"] = parseFloat(`0${v}`);
          } else if(v != null && v.length > 0) {
            this.attributes["value"] = parseFloat(v);
          } else {
            this.value_holder_element.value = "";
            this.attributes["value"] = null;
          }
          this.previous_value = this.attributes["value"];
          this.publishEvent("change", this);
        }

      } else {
        if(this.get("value") != null)
          this.value_holder_element.value = this.get("value").toString().replace(new RegExp("\.0$"), "");
        else
          this.value_holder_element.value = "";
      }

    } else if (typeof v === "number") {
      this.previous_value = v;
      this.attributes["value"] = v;
      this.publishEvent("change", this);
    } else if (v == null) {
      this.attributes["value"] = null;
    }
  }

  _updateValueFromDom({ event=null }={}) {
    this.previous_value = this.get("value");
    this.set("value", this.value_holder_element.value);
  }

  _isMaxLengthReached(v) {
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
