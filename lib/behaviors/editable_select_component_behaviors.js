import { extend_as }          from '../utils/mixin.js'
import { isBlank   }          from '../utils/string_helpers.js'
import { SelectComponentBehaviors } from '../behaviors/select_component_behaviors.js'

export class EditableSelectComponentBehaviors extends extend_as("EditableSelectComponentBehaviors").mix(SelectComponentBehaviors).with() {

  get input() { return this.component.findPart("display_input"); }

  disable() {
    this.dom_element.setAttribute("disabled", "disabled");
    this.input.setAttribute("disabled", "disabled");
    if(!isBlank(this.input.getAttribute("placeholder"))) {
      this.input.setAttribute("data-placeholder", this.input.getAttribute("placeholder"));
      this.input.setAttribute("placeholder", "");
    }
  }

  enable() {
    this.dom_element.removeAttribute("disabled");
    this.input.removeAttribute("disabled");
    if(this.input.getAttribute("data-placeholder") != null)
      this.input.setAttribute("placeholder", this.input.getAttribute("data-placeholder"));
  }



}
