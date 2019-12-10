import { extend_as       } from '../utils/mixin.js'
import { PositionManager } from '../utils/position_manager.js'

export class ComponentBehaviors extends extend_as("ComponentBehaviors").mixins() {

  constructor(c) {
    super();
    this.component      = c;
    this.pos            = PositionManager;
    this.animator       = window.webface.substitute_classes.Animator;
    this.show_hide_animation_speed = 500;
    this._display_value = {};
  }

  hide(animation_speed=this.show_hide_animation_speed) { return this.animator.hide(this.dom_element, animation_speed); }
  show(animation_speed=this.show_hide_animation_speed) { return this.animator.show(this.dom_element, animation_speed, { display_value: this.displayValueFor(this.dom_element) }); }
  async blink(animation_speed=this.show_hide_animation_speed) {
    await this.hide(0);
    return this.show();
  }

  // Hide nested element with data-component-part="<part_name>"
  hidePart(part_name, animation_speed) {
    return this._animationOnPart("hide", part_name, animation_speed);
  }
  // Show nested element with data-component-part="<part_name>"
  showPart(part_name, animation_speed) {
    return this._animationOnPart("show", part_name, animation_speed);
  }
  async blinkPart(part_name, animation_speed) {
    await this.hidePart(part_name, 0);
    return this.showPart(part_name, animation_speed);
  }

  _animationOnPart(animation_name, part_name, animation_speed) {
    var promises = [];
    this.component.findAllParts(part_name).forEach((part,i) => {
      // There may be many parts with the same name, this.displayValueFor() only caches
      // display value for the first one. This is intentional as to not ovecomplicate the code.
      // If you want very specific display value for one of the identically named parts,
      // assigned it in html with data-component-display-value attr.
      promises.push(this.animator[animation_name](part, animation_speed, { display_value: this.displayValueFor(part, part_name) }));
    }, this);
    return Promise.all(promises);
  }

  toggleDisplay() {
    return this._toggle(
      ["show", "hide"],
      this.dom_element.style.display == "none"
    );
  }

  // Lock-unlock behaviors
  //
  lock()       { this.dom_element.classList.add("locked");    }
  unlock()     { this.dom_element.classList.remove("locked"); }
  toggleLock() { this.dom_element.classList.toggle("locked"); }

  // Enable-disable behaviors
  //
  disable() {
    this.dom_element.classList.add("disabled");
    this.dom_element.setAttribute("disabled", "disabled");
  }
  enable() {
    this.dom_element.classList.remove("disabled");
    this.dom_element.removeAttribute("disabled");
  }
  toggleDisable() { this._toggle(["enable", "disable"], this.dom_element.classList.contains("disabled")); }

  /** Sometimes, we need to display an element with "display: [type];" to calculate its
    * dimensions, but actually keep it hidden. This is exactly what this method does. */
  displayHidden(el=null) {
    if(el == null) el = this.dom_element;
    el.style.opacity = "0";
    el.style.display = this.displayValueFor(this.dom_element, "_dom_element");
  }

  _toggle(behaviors, condition) {
    if(condition)
      return this[behaviors[0]]();
    else
      return this[behaviors[1]]();
  }

  _toggleElementVisibilityIfExists(selector, switch_to, { display="block" }={}) {
    var el = this.dom_element.querySelector(selector);
    if(el != null) {
      if(switch_to == "show")
        el.style.display = display;
      else
        el.style.display = "none";
    }
  }

  get dom_element() { return this.component.dom_element };

  displayValueFor(el, name) {
    // `name` refers to either part name or dom_element when passed "_dom_element".
    // We need name to cache the found display value.
    var forced_el_display_value = el.getAttribute("data-component-display-value");

    // There may be many parts with the same name, method only caches
    // display value for the first one. This is intentional as to not ovecomplicate the code.
    // If you want very specific display value for one of the identically named parts,
    // assigned it in html with data-component-display-value attr. See _animationOnPart() method above.
    if(this._display_value[name] && forced_el_display_value)
      return forced_el_display_value
    else if(this._display_value[name])
      return this._display_value[name];

    this._display_value[name] = forced_el_display_value;
    if(this._display_value[name] == null || this._display_value[name] == "")
      this._display_value[name] = this._tagDisplayValue(el);
    return this._display_value[name];
  }

  _tagDisplayValue(el) {
    switch(el.tagName.toLowerCase()) {
      case "table" : return "table";
      case "tr"    : return "table-row";
      case "td"    : return "table-cell";
      case "tbody" : return "table-row-group";
      case "thead" : return "table-header-group";
      case "li"    : return "list-item";
      case "li"    : return "list-item";
      case "span"  : return "inline";
      case "p"     : return "inline";
      default      : return "block";
    }
  }

}
