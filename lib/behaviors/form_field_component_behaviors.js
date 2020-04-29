import extend_as          from '../utils/mixin.js'
import ComponentBehaviors from '../behaviors/component_behaviors.js'

export default class FormFieldComponentBehaviors extends extend_as("FormFieldComponentBehaviors").mix(ComponentBehaviors).with() {

  get validation_errors_summary_element() {
    return this.component.firstDomDescendantOrSelfWithAttr(
      this.dom_element, { attr_name: 'data-component-attr', attr_value: 'validation_errors_summary' }
    );
  }

  showErrors() {
    this.component.children.forEach(c => c.behave("showErrors"));
    this.dom_element.classList.add('errors');
    if(this.validation_errors_summary_element != null)
      this.validation_errors_summary_element.style.display = 'block';
  }

  hideErrors() {
    this.component.children.forEach(c => c.behave("hideErrors"));
    this.dom_element.classList.remove('errors');
    if(this.validation_errors_summary_element != null)
      this.validation_errors_summary_element.style.display = 'none';
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

}
