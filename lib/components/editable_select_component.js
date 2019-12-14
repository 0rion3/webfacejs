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
      "allow_custom_value", "query_param_name", "ignore_external_click_id", "set_custom_value_on_external_click"
    ];
    this.default_attribute_values = { hide_null_option_after_option_selected: true, query_param_name: "q", allow_custom_value: false, disabled: false, set_custom_value_on_external_click: true };

    this.native_events = ["arrow.click", "option.click", "!display_input.keyup", "!display_input.keydown"];
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
    });

    // Instead of catchig a click on any part of the select component,
    // we're only catching it on arrow, because the rest of it is actually an input field.
    this.event_handlers.add({ event: this.click_event, role: 'self.arrow', handler: (self,event) => {
      if(this.get("disabled")) return;
      if(self.opened) {
        self.close();
      } else {
        self.resetOptionsFilter();
        self.open();
      }
    }});

  }

  afterInitialize() {
    super.afterInitialize();
    this.updateAttrsFromNodes({ attrs: ["allow_custom_value", "query_param_name", "ignore_external_click_id"], invoke_callbacks: false });

    /** We need this additional property to store ALL loaded properties.
      * When options are filtered, this one stores all options, regardless of whether they
      * were filterd or not.
      */
    this.original_options = this.options;
    if(this.get("input_value") === undefined)
      this.set("input_value", null);
    this.initial_value = this.get("input_value");
  }

  get current_input_value()  { return this.attribute_casting["from_dom"]["default"](this.findPart("display_input").value); }
  get name()                 { return this.findPart("input").name;          }

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

    if(!this.opened && !isBlank(this.current_input_value) && !this.options.isEmpty)
      this.open();
  }

  close() {
    super.close();
    this.focused_option = null;
  }

  /** Filters options by value user typed into the field.
    * This method is used when we don't want to fetch any options from
    * the server and simply want to allow a more flexible SelectComponent
    * with the ability to enter value and see explicitly which values match.
    */
  filterOptions() {
    this.resetOptionsFilter();
    this.original_options.forEach((k,v) => {
      if(this.current_input_value && !v.toLowerCase().startsWith(this.current_input_value.toLowerCase()))
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

  resetOptionsFilter() {
    this.options = LinkedHashMap.from(this.original_options.toObject());
    this.behave("updateOptionsInDom");
    this._listenToOptionClickEvents();
  }

  fetchOptions(fetch_url=null) {
    if(fetch_url == null) {
      let params = {};
      params[this.get("query_param_name")] = this.current_input_value;
      this.updateFetchUrlParams(params);
    }
    var promise = super.fetchOptions(fetch_url);
    // After we updated #options, we also need to update #original_options,
    // or upon filtering attemp fetched options are going to be replaced
    // with old options that were there pre-fetch.
    promise.then((response) => {
      this.original_options = LinkedHashMap.from(this.options.toObject());
    });
    return promise;
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
    if(this.options.values.includes(this.current_input_value)) {
      this.setValueByInputValue(this.optionKeyForValue(this.current_input_value));
    } else if(this.get("allow_custom_value")) {
      this.set("input_value", this.current_input_value, { run_callback: false });
      if(this.hasAttributeChanged("input_value")) {
        this.set("display_value", this.current_input_value, { run_callback: false });
        this._writeAttrToNode("input_value");
        this.publishEvent("change");
      }
    } else if(this.get("allow_custom_value") == false) {
      this.set("display_value", this.get("input_value"), { force_callback: true });
    }
  }

  externalClickCallback(event) {
    // IMPORTANT: we don't use "blur" event here and rely on external click event beucause
    // EditableSelectComponent is a complext structure. While the display input element may
    // trigger a blur event, it might actually be so that the event is only triggered because user
    // clicked on some other part of the same EditableSelectComponent DOM structure and that is no
    // reason to change the value.
    var ignore_click_id = event.target.getAttribute("data-ignore-external-click-for");
    if(ignore_click_id == null || ignore_click_id != this.get("ignore_external_click_id")) {
      super.externalClickCallback();
      if(this.get("set_custom_value_on_external_click"))
        this.setValueFromManualInput();
      this.close();
    }
  }

  /** Diff from super method --> this.options.keys.contains(this.focused_option)
   *  This prevents from setting input_value if user types in custom value.
   */
  setFocusedAndToggle() {
    if(this.opened && this.focused_option != null && this.options.keys.includes(this.focused_option))
      this.setValueByInputValue(this.focused_option);
    this.close();
  }

  setValueByInputValue(ip) {
    this.set("input_value", this.attribute_casting["from_dom"]["default"](ip));
    this.constructor.attribute_callbacks_collection['write_attr_to_dom']("input_value", this);
    this.focused_option = this.get("input_value");
  }

  _processInputKeyUpEvent(e) {
    if([38,40].includes(e.keyCode)) return; // Ignore arrow keys
    if([13,9].includes(e.keyCode)) { // ENTER, TAB
      this.setValueFromManualInput();
      this.close();
    } else if(e.keyCode == 27) { // ESC
      this.setValueByInputValue(this.get("input_value"));
    } else if(e.keyCode == 8) { // Backspace
      if(isBlank(e.target.value)) {
        this.prepareOptions();
      } else if(!isBlank(e.target.value)) {
        this.prepareOptions();
        this.open();
        this.focused_option = null;
        this.behave("focusCurrentOption");
      }
    } else {
      this.tryPrepareOptions();
    }

    if(isBlank(e.target.value)) {
      this.set("input_value", null);
      this.focused_option = null;
      this.behave("hideNoOptionsFound");
      this.close();
    }

  }

  _processKeyDownEvent(e) {
    if(this.hasEventLock("keydown") || !this._hasNode(e.target) )
      return;
    if(!this.get("disabled") && this.special_keys.includes(e.keyCode)) {
      switch(e.keyCode) {
        case 13: // ENTER
          if(this.opened) this.setFocusedAndToggle();
          break;
        case 38: // Arrow UP
          this.opened ? this.focusPrevOption() : this.setPrevValue();
          break;
        case 40: // Arrow DOWN
          this.opened ? this.focusNextOption() : this.setNextValue();
          break;
      }
      e.preventDefault();
    }
  }

}

window.webface.component_classes["EditableSelectComponent"] = EditableSelectComponent;
