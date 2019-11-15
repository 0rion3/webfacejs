import { extend_as } from '../../../lib/utils/mixin.js'
import { Component } from '../../../lib/component.js'

export class ContainerComponent extends extend_as("ContainerComponent").mix(Component).with() {
  constructor() {

    super();

    this.validations = { 'form_field.value': { 'isNumeric' : true }};

    this.event_handlers.add({ event: "click", role: "validate", handler: (self, child) => {
      self.validate();
    }});

    this.event_handlers.add({ event: "click", role: "reset", handler: (self, child) => {
      this.children[0].reset();
    }});

    this.event_handlers.add({ event: "click", role: "print_current_value", handler: (self, child) => {
      console.log(this.form_field.get("value"));
    }});

    this.event_handlers.add({ event: "click", role: "set_value_to_something", handler: (self, child) => {
      console.log(this.form_field.set("value", "something"));
    }});

  }

  afterInitialize() {
    super.afterInitialize();
    this.form_field = this.findChildrenByRole("form_field")[0];
  }

}
window.webface.component_classes["ContainerComponent"] = ContainerComponent;
