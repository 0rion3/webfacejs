import extend_as          from '../utils/mixin.js'
import ComponentBehaviors from '../behaviors/component_behaviors.js'

export default class CheckboxComponentBehaviors extends extend_as("CheckboxComponentBehaviors").mix(ComponentBehaviors).with() {

  check() {
    this.dom_element.checked = true;
    this.dom_element.setAttribute("checked", true);
  }

  uncheck() {
    this.dom_element.checked = false;
    this.dom_element.removeAttribute("checked");
  }

}
