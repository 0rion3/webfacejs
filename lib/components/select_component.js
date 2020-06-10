import extend_as                   from '../utils/mixin.js'
import AjaxRequest                 from '../services/ajax_request.js'
import string_utils                from '../utils/string_utils.js'
import TypeChecker                 from '../utils/type_checker.js'
import LinkedHashMap               from '../utils/linked_hash_map.js'
import Component                   from '../component.js'
import FormFieldComponentBehaviors from '../behaviors/form_field_component_behaviors.js'
import SelectComponentBehaviors    from '../behaviors/select_component_behaviors.js'

/** SelectComponent does is it emulates native browser experience for <select> tags including the following:
  *
  * + Opens/closes on Enter/Space
  * + Closes on Esc
  * + Closes when clicked outside of it
  * + Is navigatable with arrow keys, both when opened and closed
  * + Is searchable by typing in the first few characters
  * + Fetches options from a remote server
  *
  * Attributes description:
  *
  *   * `validation_errors_summary`, `name`, `disabled`- inherited from FormFieldComponent.
  *   *
  *   * `display_value`                 - the text that the user sees on the screen inside the element
  *   * `input_value`                   - the value that's sent to the server
  *   * `fetch_url`                     - if set, this is where an ajax request is made to fetch options
  *                                       which is used to send the value typed into the field.
  *   * `separators_below`              - if set, you can dynamically add class to option
  *                                       (eg: in order to show separation line)
  *   * `top_values`                    - if set, you can dynamically change top values in options list
  */
export default class SelectComponent extends extend_as("SelectComponent").mix(Component).with() {

  static get behaviors() { return [FormFieldComponentBehaviors, SelectComponentBehaviors]; }

  constructor() {

    super();

    this.attribute_names  = [
      "display_value", "input_value", "disabled", "name", "fetch_url", "separators_below",
      "top_values", "sort_on_fetch", "spinner_el", "hide_null_option_after_option_selected",
      "hide_null_option_display_value",
    ];
    this.default_attribute_values = {
      hide_null_option_after_option_selected: true,
      hide_null_option_display_value: false,
    };
    this.native_events = [
      `selectbox.${this.click_event.join(",")}`,
      "keypress", "keydown", "option.click"
    ];
    this.options          = new LinkedHashMap();
    this.options_data     = {};
    this.lines_to_show    = 10;
    this.fetching_options = false;

    /** When user presses a key with selectbox focused,
      * we put the character typed by this key into a stack which holds it there for some
      * time - #keypress_stack_timeout - and inserts newly typed chars to the end of it.
      * On each keypress, it finds the first match in the #options map and assigns it
      * as the value. This basically mimicks the default browser behavior for the <select>
      * element.
      */
    this.keypress_stack = "";
    this.keypress_stack_last_updated = Date.now();
    this.keypress_stack_timeout = 1000;

    this.special_keys = [32,38,40,27,13];

    /** The value that's picked and about to be set, but awaits user input - specifically a key press */
    this.focused_option = null;

    /** Indicates whether the selectbox is opened. Obviously, this class has nothing to do with visual
      * representation, but this flag is used when deciding what to do with a particular keyboard
      * event, for example - like, we don't want to call `behave('open')` if the selectbox is already opened.
     */
    this.opened = false;

    this.attribute_casting["to_dom"]["disabled"] = (v) => v ? "disabled" : null

    this.event_handlers.add({ event: this.click_event, role: 'self.selectbox', handler: (self,event) => {
      if(!self.get("disabled")) self.toggle();
    }});

    this.event_handlers.add({ event: 'keypress', role: "self", handler: (self,event) => {
      var char = new String.fromCharCodes([event.charCode]);
      self.updateKeypressStackWithChar(char);
      self.setValueFromKeypressStack();
    }});

  }

  afterInitialize() {
    super.afterInitialize();
    this.readOptionsFromDom();

    this.updateAttrsFromNodes({ attrs: [
      "display_value", "name", "fetch_url", "separators_below", "top_values",
      "sort_on_fetch", "spinner_el", "hide_null_option_after_option_selected",
      "hide_null_option_display_value",
    ], run_callback: false });
    this.updateAttrsFromNodes({ attrs: ["disabled", "input_value"], run_callback: true });

    this._listenToOptionClickEvents();
    this.focused_option = this.get("input_value");

    this.setValueByInputValue(this.get("input_value"));

    // Workaround. JS doesn't catch keydown events on divs, only on document -
    // but, surprise, it corretly sets the target, so we can still get it!
    //
    // Also note, this doesn't work in unit tests, so we have to call
    // _processKeyDownEvent(e) directly when testing.
    var self = this;
    this.root_component.dom_element.addEventListener("keydown", (e) => { self._processKeyDownEvent(e); });

    this.attribute_callbacks["input_value"] = (attr_name, self) => {
      self.constructor.attribute_callbacks_collection['write_attr_to_dom']('input_value', self)
      self.setDisplayValueFromCurrentInputValue();
    }

    this.attribute_callbacks["disabled"] = (attr_name, self) => {
      if(self.get("disabled")) {
        self.behave("disable");
        self.updateAttributes({ input_value: null, display_value: null });
      } else {
        self.behave("enable");
        self.set("input_value", this.get("_old_input_value"));
        if(this.get("display_value") == null) // we had a manually entered value
          self.set("display_value", this.get("input_value"));
      }
    };

    this.initial_value = this.get("input_value");
    this.setDisplayValueFromCurrentInputValue();

  }

  /** Sometimes we need an index of the option (int), not its input_value */
  get focused_option_id() {
    if(this.focused_option == null) return null;
    var result = this.options.keys.indexOf(this.focused_option.toString());
    if(result == -1) return null;
    else             return result;
  }

  get value() { return this.get("input_value"); }

  /** Does what it says. Parses those options from DOM and puts both input values and
    * display values into `options` Map. Note the `options` is actually a LinkedHashMap
    * and element order matters.
    */
  readOptionsFromDom() {
    var option_els = this.dom_element.querySelectorAll('[data-option-value]');
    for(var el of option_els) {
      var key = this.attribute_casting.from_dom.default(el.getAttribute('data-option-value'));
      this.options.addTail(key, this.attribute_casting.from_dom.default(el.innerText.trim()));
    }
  }

  /**************************************************************************
   * The following methods are used to effectively navigate the selectbox
   * with arrow keys. They key handler looks up the keyCode (UP or DOWN) and
   * decides which method to call. Then assignes the returned value
   * to input_value.
   **************************************************************************
   *
   * Takes the next option and returns the input_value of that option.
   * If we're at the end of the list, gets you the first option.
   * If no current option is set (passed) gets your the first option too.
   */
  getNextValue(current) {
    var key;
    var opt_keys = this.options.keys;
    if(string_utils.isEmpty(opt_keys))
      return undefined;
    if(current == null)
      key = opt_keys[0];
    else
      key = opt_keys[opt_keys.indexOf(current)+1];
    return key == null ? undefined : key;
  }
  /** Takes the previous option and returns the input_value of that option.
    * If we're at the beginning of the list, gets you the last option.
    * If no current option is set (passed) gets your the last option too.
   */
  getPrevValue(current) {
    var key;
    var opt_keys = this.options.keys;
    if(string_utils.isEmpty(opt_keys))
      return null;
    if(current == null)
      return opt_keys[opt_keys.length-1];
    key = opt_keys[opt_keys.indexOf(current)-1];
    return key;
  }
  setNextValue() {
    this.setValueByInputValue(this.getNextValue(this.get("input_value")));
  }
  setPrevValue() {
    this.setValueByInputValue(this.getPrevValue(this.get("input_value")));
  }
  setValueByInputValue(ip) {
    if(ip === undefined) return;
    this.set("input_value", this.attribute_casting["from_dom"]["default"](ip));
    this.focused_option = this.get("input_value");
  }

  /** Uses current input_value to set display value
    */
  setDisplayValueFromCurrentInputValue() {
    // Don't show null option text if selected
    let value =
      (this.get("input_value") == null &&
       this.attribute_names.includes("hide_null_option_display_value") &&
       this.get("hide_null_option_display_value")) ?
      null :
      this.options.get(this.get("input_value"));
    // Set null to display value if input value is undefined
    value = value == null ? null : value;
    this.set("display_value", value);
    if(this.hasAttributeChanged("input_value"))
      this.publishEvent("change", this);
  }
  /**************************************************************************/


  /**************************************************************************
   * The next two methods are used when the selectbox us open and we navigate
   * the items in it without actually setting them. It basically just uses the
   * same mechanism with #getNextValue/#getPrevValue, but instead of assigning
   * those values it just tells select component to display them as focused.
   *
   * Then, when user is ready, he presses ENTER or SPACE and the focused value
   * is actually assigned to input_value.
   **************************************************************************
   */
  focusNextOption() {
    this.focused_option = this.getNextValue(this.focused_option);
    this.behave('focusCurrentOption');
  }
  focusPrevOption() {
    this.focused_option = this.getPrevValue(this.focused_option);
    this.behave('focusCurrentOption');
  }
  /**************************************************************************/

  /** When user focuses on the select component (for example, by pressing the TAB key)
    * it should then be possible to press letter keys to navigate the options list without
    * opening the selectbox. That's native browser behavior for <select> element and that's
    * what's being emulated here.
    *
    * Note the use of keypress_stack. If user presses "a" and "b" within 1 second of each other
    * then the stack is going to contain "ab" and we'll be looking for the first option
    * which has display_value that starts with "ab", then setting it as current option
    * (by writing input_value and display_value attributes with #setValueByInputValue()).
   */
  setValueFromKeypressStack() {
    var found = false;
    for(let k of this.options.keys) {
      if(found) return;
      let v = this.options.get(k);
      if(v.toLowerCase().startsWith(this.keypress_stack.toLowerCase())) {
        this.setValueByInputValue(k);
        this.behave("focusCurrentOption");
        found = true;
      }
    }
  }

  /** Everytime a letter key is pressed we need to update the #keypress_stack, which
    * will then be used to set the current value of our select component.
    * We first check whether the last update was less than a second ago and append
    * the new character to the end of the stack in case the user pressed another letter
    * key less than a second ago. If it happened more than a second ago, ignore the previous
    * characters, clear the stack and put this new character into it.
    */
  updateKeypressStackWithChar(c, time=Date.now()) { // time as an optional argument used here to simplify testing
    if(this.keypress_stack_last_updated < time-this.keypress_stack_timeout) {
      this.keypress_stack_last_updated = time;
      this.keypress_stack = c;
    } else {
      this.keypress_stack += c;
    }
  }

  /** This method helps us handle what happens when user presses ENTER/SPACE keys.
    * If the selectbox is closed, then just open it. If it's opened, then it means
    * that the user is navigating it with keys and whichever option currently has focus
    * should be set as current. */
  setFocusedAndToggle() {
    if(this.opened && this.focused_option != null)
      this.setValueByInputValue(this.focused_option);
    this.toggle();
  }

  /** Makes a request to the remote server at the URL specified in `fetch_url`.
    * Sends along an additional `q` param containing the value entered by user.
    *
    * Expects a json string to be returned containing key/values. However, please note,
    * that for EditableSelectComponent currently only keys are used as values and as options
    * text presented to the user.
    */
  fetchOptions(fetch_url=null) {

    this.fetching_options = true;
    this.behave('showSpinner');
    return AjaxRequest.get(fetch_url || this.get("fetch_url")).then((response) => {
      this._setOptionsFromJson(response);
      this.behave('hideSpinner');

      if(this.options.length > 0) {
        this.behave("updateOptionsInDom");
        this.behave("hideNoOptionsFound");
      }
      else {
        this.behave("updateOptionsInDom");
        this.behave("showNoOptionsFound");
      }

      this._listenToOptionClickEvents();
      this.fetching_options = false;

    });
  }

  /** When fetching options from a remote server, you sometimes want to pass additional params,
    * so that the fetched list is filtered in some way. For instance, if you have two SelectComponents,
    * one with countries and another one with cities, it is reasonable to fetch cities when a country
    * is selected. In this case, the first SelectComponent (the one that selects a country) will
    * call this method on the second SelectComponent and pass it `{ "country": "Chile" }`,
    * then call call fetchOptions() and a request will be sent with a country name in params.
    */
  updateFetchUrlParams(params) {
    if(string_utils.isBlank(this.get("fetch_url")))
      return;
    Object.keys(params).forEach((k) => {
      let v = params[k];
      if(v == null || v == "")
        this.set("fetch_url", this.get("fetch_url").replace(new RegExp(`${k}=.*?(&|\$)`), ""));
      else {
        if(this.get("fetch_url").includes(`${k}=`))
          this.set("fetch_url", this.get("fetch_url").replace(new RegExp(`${k}=.*?(&|\$)`), `${k}=${v}&`));
        else
          this._addFetchUrlParam(k,v);
      }
      if(this.get("fetch_url").endsWith("&"))
        this.set("fetch_url", this.get("fetch_url").replace(new RegExp('&$'), ""));
    });
  }

  /** Sets the value of the select field to null */
  clear() {
    this.set("input_value", null);
  }
  /** As opposed to clear(), it resets the value of the field to the initial value
    * which may or may not be null. The initial value is the value given at component initalization
    * (most likely at page load).
    */
  reset() {
    this.set("input_value", this.initial_value);
  }

  /** Closes the selectbox when a click outside of it is detected. */
  externalClickCallback() {
    this.close();
  }

  optionKeyForValue(v) {
    var keys   = this.options.keys;
    var values = this.options.values;
    return keys[values.indexOf(v)];
  }

  open() {
    this.focused_option = this.get("input_value");
    this.behave('open');
    this.opened = true;
  }
  close() {
    this.behave('close');
    this.opened = false;
  }
  toggle() {
    this.opened ? this.close() : this.open();
  }

  /** The goal of this method is to detect whether the returned JSON contains
    * any additional data and if it does, it will store it in a separate attr.
    */
  _setOptionsFromJson(json) {
    var parsed_json = {};

    if(json.constructor.name == "Array"){
      json.forEach((el) => {
        if(typeof el[1] == "string")
          parsed_json[el[0]] = el[1];
        else if(TypeChecker.isSimpleObject(el[1])) {
          parsed_json[el[0]] = el[1]["display_value"];
          delete el[1]["display_value"];
          this.options_data[el[0]] = el[1];
        }
        else
          window.webface.logger.capture("Warning: cannot parse the fetched json:\n" + json.toString(), { log_level: "WARN" });
      });
    } else if(TypeChecker.isSimpleObject(json)) {
      Object.keys(json).forEach((k) => {
        let v = json[k];
        if(typeof v == "string")
          parsed_json[k] = v;
        else if(TypeChecker.isSimpleObject(v)) {
          parsed_json[k] = v["display_value"];
          delete v["display_value"];
          this.options_data[k] = v;
        }
        else
          window.webface.logger.capture("Warning: cannot parse the fetched json:\n" + json.toString(), { log_level: "WARN" });
      });
    }
    else
      window.webface.logger.capture("Warning: cannot parse the fetched json:\n" + json.toString(), { log_level: "WARN" });

    // Sort json alphabetically
    this.options = LinkedHashMap.fromObject(parsed_json)

    if(this.get("sort_on_fetch"))
      this.options.sort();

    // Null option should always be on top and not affected by sorting.
    var null_option = this.options.get("null")
    if(null_option)
      this.options.addHead("null", null_option);

  }

  /** This methd is called not once, but every time we fetch new options from the server,
    * because the newly added option elements are not being monitored by the previously
    * created listener.
   */
  _listenToOptionClickEvents() {
    this.event_handlers.remove({ event: this.click_event, role: 'self.option' });
    this.event_handlers.add({ event: this.click_event, role: 'self.option', handler: (self,event) => {
      var t = event.target;
      self.setValueByInputValue(t.getAttribute('data-option-value'));
      self.close();
    }});
    this.reCreateNativeEventListeners();
  }

  _processKeyDownEvent(e) {
    if(this.hasEventLock("keydown") || !this._hasNode(e.target) )
      return;
    if(!this.get("disabled") && this.special_keys.includes(e.keyCode)) {
      switch(e.keyCode) {
        case 27: // ESC
          this.close();
          break;
        case 38: // Arrow UP
          this.opened ? this.focusPrevOption() : this.setPrevValue();
          break;
        case 40: // Arrow DOWN
          this.opened ? this.focusNextOption() : this.setNextValue();
          break;
        case 13: // ENTER
          this.setFocusedAndToggle();
          break;
        case 32: // SPACE
          this.setFocusedAndToggle();
          break;
      }
      e.preventDefault();
    }
  }

  _addFetchUrlParam(name, value) {
    var new_fetch_url = this.get("fetch_url");
    if(!new_fetch_url.includes("?"))
      new_fetch_url = new_fetch_url + "?";
    if(!new_fetch_url.endsWith("?"))
      new_fetch_url = new_fetch_url + "&";
    this.set("fetch_url", new_fetch_url + `${name}=${value}`);
  }

}
window.webface.component_classes["SelectComponent"] = SelectComponent;
