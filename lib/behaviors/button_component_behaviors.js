import { extend_as }          from '../utils/mixin.js'
import { ComponentBehaviors } from '../behaviors/component_behaviors.js'

export class ButtonComponentBehaviors extends extend_as("ButtonComponentBehaviors").mix(ComponentBehaviors).with() {

  disable() {
    this.dom_element.setAttribute("disabled", "disabled");
  }

  enable() {
    this.dom_element.removeAttribute("disabled");
  }

  unlock() {
    this.component.removeEventLock(this.component.click_event);
    super.unlock();
  }

}
