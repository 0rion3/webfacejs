import extend_as          from '../utils/mixin.js'
import ComponentBehaviors from '../behaviors/component_behaviors.js'

export default class ContextMenuComponentBehaviors extends extend_as("ContentMenuComponentBehaviors").mix(ComponentBehaviors).with() {

  show(anchor) {
    this.displayHidden(this.dom_element);
    this.pos.placeBelowBottomRight(this.dom_element, anchor);
    this.animator.show(this.dom_element, 400);
  }

  hide() {
    this.animator.hide(this.dom_element, 200);
  }

}
