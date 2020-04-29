import extend_as          from '../utils/mixin.js'
import ComponentBehaviors from '../behaviors/component_behaviors.js'

export default class HintComponentBehaviors extends extend_as("HintComponentBehaviors").mix(ComponentBehaviors).with() {

  get anchor_el() { return this.component.anchor_el };

  constructor(c) {
    super(c);
    this.pos.base_offset = { "x": -30, "y": 15, "units": "px" };
  }

  show() {

    if(this.component.visible)
      return new Promise((resolve,reject) => reject(`Hint ${this.component.get("hint_id")} is already visible`));

    // We first need to calculate dimensions and available space on the right and below.
    // Thus, we're using this method.
    this.displayHidden();

    var has_right_space = this._hasSpaceOnTheRight();
    var has_above_space = this._hasSpaceAbove();

    if(has_right_space && has_above_space) {
      this.pos.placeAboveTopRightCorner(this.dom_element, this.anchor_el);
      this._setPointerArrowClass("arrowBottomLeft");
    }
    else if(has_right_space && !has_above_space) {
      this.pos.placeBelowBottomRightCorner(this.dom_element, this.anchor_el);
      this._setPointerArrowClass("arrowTopLeft");
    }
    else if(!has_right_space && has_above_space) {
      this.pos.placeAboveTopLeftCorner(this.dom_element, this.anchor_el);
      this._setPointerArrowClass("arrowBottomRight");
    }
    else if(!has_right_space && !has_above_space) {
      this.pos.placeBelowBottomLeftCorner(this.dom_element, this.anchor_el);
      this._setPointerArrowClass("arrowTopRight");
    }

    return this.animator.show(this.dom_element, 500);

  }

  hide() {
    return this.animator.hide(this.dom_element, 100);
  }

  _hasSpaceOnTheRight() {
    var anchor_dimensions = this.anchor_el.getBoundingClientRect();
    var body_dimensions   = this.component.constructor.owner_document.body.getBoundingClientRect();
    var hint_dimensions   = this.dom_element.getBoundingClientRect();
    return (body_dimensions.width - (anchor_dimensions.left + anchor_dimensions.width)) > hint_dimensions.width;
  }

  _hasSpaceAbove() {
    var anchor_dimensions = this.anchor_el.getBoundingClientRect();
    var hint_dimensions   = this.dom_element.getBoundingClientRect();
    return anchor_dimensions.top > hint_dimensions.height;
  }

  _setPointerArrowClass(arrow_position_class) {
    this.dom_element.classList.forEach((c) => {
      if(c.startsWith("arrow")) this.dom_element.classList.remove(c);
    });
    this.dom_element.classList.add(arrow_position_class);
  }

}
