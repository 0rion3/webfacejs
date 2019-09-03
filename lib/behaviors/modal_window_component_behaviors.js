import { extend_as }          from '../utils/mixin.js'
import { ComponentBehaviors } from '../behaviors/component_behaviors.js'

export class ModalWindowComponentBehaviors extends extend_as("ModalWindowComponentBehaviors").mix(ComponentBehaviors).with() {

  show() {
    var result = this.animator.show(this.dom_element, this.show_hide_animation_speed);
    return result;
  }

  hide() {
    // In some situations, a modal windows is attempted to be closed twice, while the dom_element is already removed
    // so this check mitigates that case.
    if(this.dom_element != null) {
      let f = this.animator.hide(this.dom_element, this.show_hide_animation_speed);
      f.then((r) => {
        try      { this.dom_element.remove(); }
        catch(e) {}
      });
      return f;
    } else {
      return new Promise((resolve, reject) => {});
    }
  }

  hideCloseButton() {
    this.component.findPart("close").remove();
  }

}
