import { extend_as } from '../../../lib/utils/mixin.js'
import { Component } from '../../../lib/component.js'

export class ContainerComponent extends extend_as("ContainerComponent").mix(Component).with() {
  constructor() {
    super();

    this.event_handlers.add({ event: "click", role: "lock_button", handler: (self, child) => {
      child.set("disabled", true);
    }});

  }
}
window.webface.component_classes["ContainerComponent"] = ContainerComponent;
