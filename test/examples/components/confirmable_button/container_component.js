import extend_as from '../../../lib/utils/mixin.js'
import Component from '../../../lib/component.js'

export class ContainerComponent extends extend_as("ContainerComponent").mix(Component).with() {
  constructor() {
    super();

    this.event_handlers.add({ event: "click_and_confirm", role: "confirmable_button", handler: (self, child) => {
      console.log("Confirmed!");
    }});

    this.event_handlers.add({ event: "click_and_deny", role: "confirmable_button", handler: (self, child) => {
      console.log("Denied!");
    }});

    this.event_handlers.add({ event: "click", role: "confirmable_button", handler: (self, child) => {
      console.log("Clicked BUT not confirmed yet!");
    }});

  }
}
window.webface.component_classes["ContainerComponent"] = ContainerComponent;
