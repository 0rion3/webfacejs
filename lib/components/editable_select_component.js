import { extend_as }                        from '../utils/mixin.js'
import { Component }                        from '../component.js'
import { isBlank, isEmpty }                 from '../utils/string_helpers.js'
import { LinkedHashMap }                    from '../utils/linked_hash_map.js'
import { SelectComponent }                  from '../components/select_component.js'
import { FormFieldComponentBehaviors }      from '../behaviors/form_field_component_behaviors.js'
import { SelectComponentBehaviors }         from '../behaviors/select_component_behaviors.js'
import { EditableSelectComponentBehaviors } from '../behaviors/editable_select_component_behaviors.js'

/** Sometimes you want to allow users to enter values for the select field manually. Perhaps, you want to give them a more explicit way to filter the options.
  * Or, perhaps, you actually want to allow them to enter custom values into the select box. This is what this component is designed to do.
  * It inherits from SelectComponent and the documentation for SelectComponent applies to EditableSelectComponent for the most part too.
  *
  * To understand how this component works, it's simply better to observe it in action, but here's a number of distinct behaviors you'll notice:
  *
  * - When user begins to type, the list of options is automatically reduced to the ones that match the typed text.
  * - The select box automatically expands after the user types something in to present the filtered list of options.
  * - Filtering can occur both by display and input values.
  * - Pressing enter saves the custom entered #display_value as #input_value.
  *
  * Properties description:
  *
  *   * `validation_errors_summary`, `name`, `disabled`- inherited from FormFieldComponent.
  *   *
  *   * `display_value`       - the text that the user sees on the screen inside the element
  *   * `input_value`         - the value that's sent to the server
  *   * `fetch_url`           - if set, this is where an ajax request is made to fetch options
  *   * `query_param_name`    - when an ajax request is sent to `fetch_url`, this is the name of the param
  *                             which is used to send the value typed into the field.
  *   * `allow custom value`  - if true, user is allowed to enter custom value into the field
  */
export class EditableSelectComponent extends extend_as("EditableSelectComponent").mix(SelectComponent).with() {

  static get behaviors() { return [FormFieldComponentBehaviors, EditableSelectComponentBehaviors]; }

  constructor() {

    super();

    this.attribute_names  = [
      "display_value", "input_value", "disabled", "name", "fetch_url", "separators_below",
      "top_values", "sort_on_fetch", "spinner_el", "hide_null_option_after_option_selected",
      "allow_custom_value", "query_param_name"
    ];
    this.default_attribute_values = { hide_null_option_after_option_selected: true, query_param_name: "q", allow_custom_value: false, disabled: false };

    this.native_events = ["arrow.click", "option.click", "!display_input.keyup", "!display_input.keydown", "!display_input.change", "!display_input.blur"];
    this.behaviors     = [FormFieldComponentBehaviors, EditableSelectComponentBehaviors];

    this.keypress_stack_timeout = 500;

    /** We need to ingore a press of SPACE key, because it is a actually a character
      * used while typing field value, whereas in traditional SelectComponent (from which this
      * class inherits) pressing SPACE opens the select options.
      */
    this.special_keys = [38,40,27,13];

    this.event_handlers.remove({ event: this.click_event, role: 'self.selectbox' });
    this.event_handlers.remove({ event: 'keypress', role: "#self" });

    this.event_handlers.addForRole("self.display_input", {

      "keyup": (self,event) => self._processInputKeyUpEvent(event),

      "keydown": (self,event) => {
        if(event.keyCode == 13) // ENTER
          event.preventDefault();
        else if(event.keyCode == 9) // TAB
          self._processInputKeyUpEvent(event);
      }

      /* I don't want to listen to the change event. First, it creates a loop,
       * when we assign a new input_value and the corresponding html input value is updated.
       * Second, values are supposed to be typed in, not pasted. Don't paste.
       *
       * The commented code is left here for future reference when
       * we have time to properly fix this behavior.
       */

      //
      //"change"  : (self,event) => self.prepareOptions()
    });

    // Instead of catchig a click on any part of the select component,
    // we're only catching it on arrow, because the rest of it is actually an input field.
    this.event_handlers.add({ event: this.click_event, role: 'self.arrow', handler: (self,event) => {
      if(this.get("disabled"))
        return;
      if(self.opened) {
        self.behave('close');
        self.opened = false;
      } else {
        self.behave('open');
        self.opened = true;
      }
    }});

    this.attribute_callbacks["input_value"] = (attr_name, self) => {
      self.constructor.attribute_callbacks_collection['write_attr_to_dom']("input_value", self);
      self.set("display_value", self.options.get(self.get("input_value")) || self.get("input_value"));

      // This is a special case of publishing a "change" event. Normally, the change
      // event is published by the code in SelectComponent (parent class), but
      // parent class doesn't know how to set input_value to null or custom_value,
      // thus we need to handle it here.
      if(self.get("input_value") == null || self.get("input_value") == self.get("display_value"))
        self.publishEvent("change", self);
    };

    this.attribute_callbacks["disabled"] = (attr_name, self) => {
      if(self.get("disabled")) {
        self.behave("disable");

        // TODO: have an easy way to update attrs without invoking callbacks!
        this.updateAttributes({ "display_value": "", "input_value": ""}, { callback: false });
        self.findPart("display_input").value = "";
        findPart("input").value = "";
      }
      else
        self.behave("enable");
    };

  }

  afterInitialize() {
    super.afterInitialize();
    this.updateAttrsFromNodes({ attrs: ["allow_custom_value", "query_param_name"], invoke_callbacks: false });

    /** We need this additional property to store ALL loaded properties.
      * When options are filtered, this one stores all options, regardless of whether they
      * were filterd or not.
      */
    this.original_options = this.options;
    if(this.get("input_value") === undefined)
      this.set("input_value", null);
  }

  get current_input_value() { return this.findPart("display_input").value; }
  get name()                { return this.findPart("input").name;          }


  /** Looks at how much time has passed since the last keystroke. If not much,
    * let's wait a bit more, maybe user is still typing. If enough time passed,
    * let's start fetching options from the remote server / filtering.
    */
  tryPrepareOptions() {
    if(this.keypress_stack_timeout == 0)
      this.prepareOptions();
    else {
      this.keypress_stack_last_updated = Date.now();
      var self = this;
      setTimeout(() => {
        var now = Date.now();
        if((now - this.keypress_stack_last_updated >= this.keypress_stack_timeout) && !this.fetching_options)
          self.prepareOptions();
      }, this.keypress_stack_timeout);
    }
  }

  /** Decides between fetching an option from a remote URL (if fetch_url is set)
    * or just filtering them out of existing pre-loaded ones.
    * Once finished, opens the select box options.
    */
  prepareOptions() {
    if(this.fetch_url == null)
      this.filterOptions();
    else
      this.fetchOptions();

    if(this.current_input_value.length > 0) {
      this.behave('open');
      this.opened = true;
    }
  }

  /** Filters options by value user typed into the field.
    * This method is used when we don't want to fetch any options from
    * the server and simply want to allow a more flexible SelectComponent
    * with the ability to enter value and see explicitly which values match.
    */
  filterOptions() {
    this.options = LinkedHashMap.from(this.original_options.toObject());
    this.original_options.forEach((k,v) => {
      if(!v.toLowerCase().startsWith(this.current_input_value.toLowerCase()))
        this.options.remove(k);
    });
    if(this.options.isEmpty)
      this.behave("showNoOptionsFound");
    else
      this.behave("hideNoOptionsFound");

    this.behave("updateOptionsInDom");
    if(!this.options.isEmpty)
      this._listenToOptionClickEvents();
  }

  fetchOptions(fetch_url=null) {
    if(fetch_url == null) {
      let params = {};
      params[this.get("query_param_name")] = this.current_input_value;
      this.updateFetchUrlParams(params);
    }
    var future = super.fetchOptions(fetch_url);
    // After we updated #options, we also need to update #original_options,
    // or upon filtering attemp fetched options are going to be replaced
    // with old options that were there pre-fetch.
    future.then((response) => {
      this.original_options = LinkedHashMap.from(this.options.toObject());
    });
  }

  /** Cleares the select box input and sets it to the previous value. Usually
    * called when user presses ESC key or focus is lost on the select element.
    */
  clearCustomValue() {
    this.set("display_value", this.get("display_value"));
  }

  /** Sets value after user hits ENTER, TAB or clicks outside the field.
    * If value is in #options, then input_value is set to option's key
    * If not, then input_value is set to whatever user typed into the field.
    */
  setValueFromManualInput() {
    if(this.options.values.includes(this.current_input_value))
      this.setValueByInputValue(this.optionKeyForValue(this.current_input_value));
    else if(this.get("allow_custom_value"))
      this.set("input_value", this.attribute_casting["from_dom"]["default"](this.current_input_value));
    else if(this.get("allow_custom_value") == false) {
      this.set("display_value", this.get("input_value"), { force_callback: true });
    }
  }

  externalClickCallback() {
    super.externalClickCallback();
    this.setValueFromManualInput();
  }

  /** Diff from super method --> this.options.keys.contains(this.focused_option)
   *  This prevents from setting input_value if user types in custom value.
   */
  setFocusedAndToggle() {
    if(this.opened && this.focused_option != null && this.options.keys.includes(this.focused_option))
      this.setValueByInputValue(this.focused_option);
    this.behave('toggle');
    this._toggleOpenedStatus();
  }

  _processInputKeyUpEvent(e) {
    if([13, 9].includes(e.keyCode)) { // ENTER, TAB
      this.setValueFromManualInput();
    } else if(e.keyCode == 27) { // ESC
      this.setValueByInputValue(this.get("input_value"));
    } else if(e.keyCode == 8 && e.target.value.length == 0) { // Backspace
      this.prepareOptions();
    }

    this.tryPrepareOptions();

    if(isBlank(e.target.value)) {
      this.set("input_value", null);
      this.focused_option = null;
      this.behave("hideNoOptionsFound");
      this.behave("close");
      this.opened = false;
    }

  }

}

window.webface.component_classes["EditableSelectComponent"] = EditableSelectComponent;
