import { extend_as } from '../utils/mixin.js'
import { Component } from '../component.js'
import { FormFieldComponentBehaviors } from '../behaviors/form_field_component_behaviors.js'

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
export class FormFieldComponent extends extend_as("FormFieldComponent").mix(Component).with() {

  static get behaviors() { return [FormFieldComponentBehaviors]; }

  /** Component HTML code may consits of various tags, where, for example, a DIV wraps the actual field
    * holding the value. This is why we need a special element inside the DOM-structure of the component
    * called "value_holder". It's usually an input, hidden or not - depends on how a particular FormFieldComponent
    * is designed.
    */
  get value_holder_element() {
    var value_holder = this.firstDomDescendantOrSelfWithAttr(
      this.dom_element, { attr_name: 'data-component-part', attr_value: 'value_holder' }
    );
    if(value_holder == null)
      value_holder = this.dom_element;
    return value_holder;
  }

  constructor() {
    super();

    this.native_events                = ["value_holder.change", "change", "!value_holder.keyup", "keyup"];
    this.no_propagation_native_events = ["change"];
    this.value_attr               = 'value';
    this.attribute_names              = ["validation_errors_summary", "name", "disabled", "value"];

    this.attribute_names.push(this.value_attr);
    this.attribute_callbacks[this.value_attr] = (attr_name, self) => {
      self.setValueForValueHolderElement(self.attributes[self.value_attr]);
      self.publishEvent("change", { "component": this, "event": self });
    };

    this.event_handlers.addForEvent('change', {
      '#self':             (self,event) => self._updateValueFromDom(),
      'self.value_holder': (self,event) => self._updateValueFromDom()
    });

    this.attribute_casting["to_dom"]["disabled"] = (v) => v ? "disabled" : null;

  }

  afterInitialize() {
    super.afterInitialize();

    this.event_handlers.add({ event: 'keyup', role: (this.dom_element == this.value_holder_element ? '#self' : 'self.value_holder'), handler: (self,event) => {
      self._updateValueFromDom({ event: "keyup" });
    }});

    this._updateValueFromDom();
    this.initial_value = this.get(this.value_attr);
  }

  validate({ deep=true }={}) {
    super.validate();
    return this.valid;
  }

  /** Resets the value of the field to the initial state */
  reset() {
    this.set("value", this.initial_value);
  }

  setValueForValueHolderElement(v) {
    this.previous_value = this.get(this.value_attr);
    this.attributes["value"] = v;
    v == null ? v = "" : v = v.toString();
    if(this.value_holder_element.value != v) this.value_holder_element.value = v;
  }

  _updateValueFromDom({ event=null }={}) {
    // Callback is set to `false` here because we don't need to update the value_attr
    // of the value_holder element after we've just read the actual value from it. That results in a loop
    // we don't want to have!
    this.previous_value = this.get(this.value_attr);
    this.updateAttribute(this.value_attr, (this.value_holder_element.value == "" ? null : this.value_holder_element.value), { callback: false });
    this.publishEvent("change", { "component": this, "event": event });
  }

}
window.webface.component_classes["FormFieldComponent"] = FormFieldComponent;
