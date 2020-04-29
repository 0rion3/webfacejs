import extend_as from '../../../lib/utils/mixin.js'
import Component from '../../../lib/component.js'

export class ContainerComponent extends extend_as("ContainerComponent").mix(Component).with() {
  constructor() {
    super();

    this.event_handlers.add({ event: "click", role: "check", handler: (self, child) => {
      var radio_button = self.findChildrenByRole("radio_button")[0];
      var rand_value = Object.keys(radio_button.options)[Math.floor(Math.random() * Object.keys(radio_button.options).length)];
      radio_button.set("value", rand_value);
    }});

    this.event_handlers.add({ event: "click", role: "uncheck", handler: (self, child) => {
      self.findChildrenByRole("radio_button")[0].set("value", null);
    }});

    this.event_handlers.add({ event: "click", role: "print_value", handler: (self, child) => {
      console.log(self.findChildrenByRole("radio_button")[0].get("value"));
    }});

  }
}
window.webface.component_classes["ContainerComponent"] = ContainerComponent;
