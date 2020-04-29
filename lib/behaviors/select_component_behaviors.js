import extend_as          from '../utils/mixin.js'
import LinkedHashMap      from '../utils/linked_hash_map.js'
import ComponentBehaviors from '../behaviors/component_behaviors.js'

export default class SelectComponentBehaviors extends extend_as("SelectComponentBehaviors").mix(ComponentBehaviors).with() {

  constructor(c) {
    super(c);
    this.options_container = this.component.findPart("options_container");
    this.selectbox         = this.component.findPart("selectbox");
    this.scroll_pos_bottom = 0;
  }

  showSpinner()        { this._toggleElementVisibilityIfExists(this.component.get("spinner_el"), "show", { display: "inline"})};
  hideSpinner()        { this._toggleElementVisibilityIfExists(this.component.get("spinner_el"), "hide") };
  showNoOptionsFound() { this._toggleElementVisibilityIfExists(".noOptionsFoundMessage", "show") };
  hideNoOptionsFound() { this._toggleElementVisibilityIfExists(".noOptionsFoundMessage", "hide") };

  open() {
    this.scroll_pos_bottom = this.component.lines_to_show-1;
    this.selectbox.classList.add("open");
    this.options_container.style.minWidth = `${this.pos.getDimensions(this.selectbox)['x'] - 2}px`;
    this.options_container.style.display  = 'block';
    this._applyLinesToShow();
    if(this.component.get("input_value") != null) {
      this.showNoValueOption();
      this.focusCurrentOption();
    } else {
      this.hideNoValueOption();
    }
  }

  close() {
    this.selectbox.classList.remove("open");
    this.options_container.style.display = 'none';
    this._removeFocusFromOptions();
  }

  disable() {
    super.disable();
    this.component.set("disabled", true);
    this.component.addEventLock("#any");
  }

  enable() {
    super.enable();
    this.component.set("disabled", false);
    this.component.removeEventLock("#any");
  }

  focusCurrentOption() {
    this._removeFocusFromOptions();
    var current_option = this.options_container.querySelector(`[data-option-value="${this.component.focused_option}"]`);
    if(current_option != null) {
      current_option.classList.add("focused");
      this._scroll();
    }
  }

  hideNoValueOption() {
    this.null_option_el = this.options_container.querySelector('[data-option-value="null"]');
    if(this.null_option_el)
      this.null_option_el.remove();
  }

  showNoValueOption() {
    if(
      this.null_option_el != null &&
      this.options_container.children.length > 0 &&
      !this.component.get("hide_null_option_after_option_selected")
    )
      this.options_container.prepend(this.null_option_el);
  }

  /** Adds an `optionSeparator` class to option set in `separators_below` parameter, e.g.:
    * `<div data-component-class="SelectComponent" data-separators-below="JPY">`
    * `<div data-component-part="option" class="option optionSeparator">JPY</div>`
    * So, you need just to specify css styles for `optionSeparator` class.
    */
  addSeparationLine() {
    this.component.findAllParts("option").forEach((el) => {
      if(this.component.get("separators_below").includes(el.innerText.trim())) el.classList.add("optionSeparator");
    }, this);
  }

  /** Moves values in `top_values` attribute to the top of the options list */
  setTopValues() {
    var top_values_list = this.component.get("top_values").split(",");
    var options = this.component.findAllParts("option");

    var final_hash = new LinkedHashMap();

    top_values_list.forEach((top_value) => {
      options.forEach((el) => {
        if(top_value == el.innerText.trim()) {
          final_hash.addTail(el.getAttribute("data-option-value"), top_value);
          el.remove();
        }
      });
    });

    options.forEach((el) => {
      var key = el.getAttribute("data-option-value");
      if(!final_hash.get(key)) {
        final_hash.addTail(key, el.innerText.trim());
        el.remove();
      }
    });

    this.component.options = final_hash;
    this.updateOptionsInDom();
    this.component._listenToOptionClickEvents();
  }

  /** Takes the `options` attr and creates html elements for each given option
    * within the options container. All previously existing options are removed from that
    * container.
    */
  updateOptionsInDom() {
    this.component.findAllParts("option").forEach((el) => el.remove());
    this.component.options.forEach((k,v) => {
      var option = this.component.findPart("option_template").cloneNode(true);
      option.setAttribute("data-component-part", "option");
      option.setAttribute("data-option-value", k.toString());
      option.style.display = null;
      option.innerText = v;
      this.options_container.append(option);
    }, this);
  }

  _removeFocusFromOptions() {
    this.options_container.querySelectorAll('.option').forEach((el) => el.classList.remove("focused"));
  }

  _applyLinesToShow() {
    var opt_els = this.options_container.querySelectorAll('[data-component-part="option"]');
    if(opt_els.length == 0)
      return;
    var option_height = this.pos.getDimensions(opt_els[0])['y'];
    if(this.component.lines_to_show > opt_els.length)
      this.options_container.style.height = `${option_height*opt_els.length}px`;
    else
      this.options_container.style.height = `${option_height*this.component.lines_to_show}px`;
  }

  _scroll() {
    var option_height = this.pos.getDimensions(this.component.findPart("option"))['y'];

    if(this.scroll_pos_bottom < this.component.focused_option_id) {
      this.scroll_pos_bottom = this.component.lines_to_show + this.scroll_pos_bottom;
      this._scrollDown(option_height);
    } else if(this.scroll_pos_bottom-this.component.lines_to_show+1 > this.component.focused_option_id) {
      this.scroll_pos_bottom = this.scroll_pos_bottom - this.component.lines_to_show;
      this._scrollUp(option_height);
    }
  }

  _scrollDown(option_height) {
    this.options_container.scrollTop = option_height*this.component.focused_option_id;
  }
  _scrollUp(option_height) {
    this.options_container.scrollTop = option_height*this.component.focused_option_id-((this.component.lines_to_show-1)*parseInt(option_height));
  }

}
