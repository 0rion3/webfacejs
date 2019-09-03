import { extend_as       } from '../utils/mixin.js'
import { PositionManager } from '../position_manager.js'

export class ComponentBehaviors extends extend_as("ComponentBehaviors").mixins() {

  constructor(c) {
    super();
    this.component      = c;
    this.pos            = PositionManager;
    this.animator       = window.webface.substitute_classes.Animator;
    this.show_hide_animation_speed = 500;
  }

  hide() { return this.animator.hide(this.dom_element, this.show_hide_animation_speed); }
  show() { return this.animator.show(this.dom_element, this.show_hide_animation_speed, { display_value: this.display_value }); }

  // Hide nested element with data-component-part="<part_name>"
  hidePart(part_name, delay) { return this.animator.hide(this.component.findPart(part_name), delay); }
  // Show nested element with data-component-part="<part_name>"
  showPart(part_name, delay, { display_value = "block" } = {}) { return this.animator.show(this.component.findPart(part_name), delay, { display_value }); }

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
    el.style.display = this.display_value;
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

  get display_value() {
    if(this._display_value != null)
      return this._display_value;
    this._display_value = this.dom_element.getAttribute("data-component-display-value");
    if(this._display_value == null || this._display_value == "")
      this._display_value = "block";
    return this._display_value;
  }

}
