import extend_as                   from '../utils/mixin.js'
import Component                   from '../component.js'
import FormFieldComponentBehaviors from '../behaviors/form_field_component_behaviors.js'

/** This is a basic component for form fields, from which most other form field components should inherit from.
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
export default class FormFieldComponent extends extend_as("FormFieldComponent").mix(Component).with() {

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

  get previous_value() {
    return this.attribute_old_values[this.value_attr];
  }

  get is_text_input() {
    if(this._is_text_input == null) {
      this._is_text_input = ["text", "password", "date", "datetime-local", "email", "month", "number", "search", "tel", "time", "url", "week"]
        .includes(this.value_holder_element.getAttribute("type")) || this.value_holder_element.tagName.toLowerCase() == "textarea";
    }
    return this._is_text_input;
  }

  constructor() {
    super();

    this.native_events                = ["value_holder.change", "value_holder.paste", "change", "!value_holder.keyup", "keyup"];
    this.no_propagation_native_events = ["change"];
    this.value_attr                   = "value";
    this.attribute_names              = ["validation_errors_summary", "name", "disabled"];

    this.attribute_names.push(this.value_attr);
    this.attribute_callbacks[this.value_attr] = (attr_name, self) => {
      self._writeAttrToNode(attr_name);
      self.publishEvent("change", { "component": this, "event": self });
    };

    this.attribute_casting.to_dom.disabled           = (v) => v                    ? "disabled" : null;
    this.attribute_casting.from_dom.disabled         = (v) => v != null && v != "" ? true       : false;
    this.attribute_casting.from_dom[this.value_attr] = (v) => {
      if(["null", "true", "false"].includes(v)) return v;
      else                                      return this.attribute_casting.from_dom.default(v);
    }

  }

  afterInitialize() {
    super.afterInitialize();

    if(this.value_holder_element)
      this.value_holder_element.setAttribute("data-component-attr", "value");

    let change_event_target_role = (this.dom_element == this.value_holder_element) ? '#self' : 'self.value_holder';

    if(this.is_text_input) {
      this.event_handlers.addForRole(change_event_target_role, {
        paste: (self, event) => {
          self.replaceSelection();
          event.preventDefault();
          self._updateValueFromDom();
        },
        keyup: (self, event) => {
          self.value_holder_element.dispatchEvent(new Event('change'));
          self._updateValueFromDom();
        },
        change: (self, event) => {
          self._updateValueFromDom();
          if(change_event_target_role == "self.value_holder")
            self.publishEvent("change");
        }
      });

    }

    this.updateAttrsFromNodes();
    this.initial_value = this.get(this.value_attr) || null;
  }

  validate({ deep=true }={}) {
    super.validate();
    return this.valid;
  }

  /** Sets the value of the field to null */
  clear() {
    this.set(this.value_attr, null);
  }
  /** As opposed to clear(), it resets the value of the field to the initial value
    * which may or may not be null. The initial value is the value given at component initalization
    * (most likely at page load).
    */
  reset() {
    this.set(this.value_attr, this.initial_value);
  }

  replaceSelection() {
    let paste = (event.clipboardData || window.clipboardData).getData('text');
    let splitted_value = [
      this.value_holder_element.value.slice(0, this.value_holder_element.selectionStart),
      paste,
      this.value_holder_element.value.slice(this.value_holder_element.selectionEnd)
    ];
    this.value_holder_element.value = splitted_value.join("");
  }

  _updateValueFromDom({ event=null }={}) {
    // Callback is set to `false` here because we don't need to update the value_attr
    // of the value_holder element after we've just read the actual value from it. That results in a loop
    // we don't want to have!
    let old_value = this.get(this.value_attr);
    this.updateAttrsFromNodes({ attrs: [this.value_attr], run_callback: false });
    if(old_value != this.get(this.value_attr)) {
      this.attribute_old_values[this.value_attr] = this.get(this.value_attr);
      this.publishEvent("change", { "component": this, "event": event });
    }
  }

}
window.webface.component_classes["FormFieldComponent"] = FormFieldComponent;
