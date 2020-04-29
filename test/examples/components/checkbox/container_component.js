import extend_as from '../../../lib/utils/mixin.js'
import Component from '../../../lib/component.js'

export class ContainerComponent extends extend_as("ContainerComponent").mix(Component).with() {
  constructor() {
    super();

    this.event_handlers.add({ event: "click", role: "check", handler: (self, child) => {
      self.findChildrenByRole("checkbox")[0].set("checked", true);
    }});

    this.event_handlers.add({ event: "click", role: "uncheck", handler: (self, child) => {
      self.findChildrenByRole("checkbox")[0].set("checked", false);
    }});

    this.event_handlers.add({ event: "click", role: "print_status", handler: (self, child) => {
      console.log(self.findChildrenByRole("checkbox")[0].get("checked"));
    }});

  }
}
window.webface.component_classes["ContainerComponent"] = ContainerComponent;
