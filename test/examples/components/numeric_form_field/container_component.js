import extend_as from '../../../lib/utils/mixin.js'
import Component from '../../../lib/component.js'

export class ContainerComponent extends extend_as("ContainerComponent").mix(Component).with() {
  constructor() {

    super();

    this.validations = { 'numeric_form_field.value': { 'isMoreThan' : 1, 'isLessThan' : 100 }};

    this.event_handlers.add({ event: "click", role: "validate", handler: (self, child) => {
      self.validate();
    }});

    this.event_handlers.add({ event: "click", role: "reset", handler: (self, child) => {
      this.children[0].reset();
    }});

    this.event_handlers.add({ event: "click", role: "print_current_value", handler: (self, child) => {
      console.log(this.form_field.get("value"));
    }});

  }

  afterInitialize() {
    super.afterInitialize();
    this.form_field = this.findChildrenByRole("numeric_form_field")[0];
  }

}
window.webface.component_classes["ContainerComponent"] = ContainerComponent;
