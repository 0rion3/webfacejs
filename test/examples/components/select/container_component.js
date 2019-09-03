import { extend_as } from '../../../lib/utils/mixin.js'
import { Component } from '../../../lib/component.js'

export class ContainerComponent extends extend_as("ContainerComponent").mix(Component).with() {

  constructor() {
    super();
    this.event_handlers.add({ event: "click", role: "fetch_options", handler: (self, child) => {
      self.findChildrenByRole("selectbox")[0].fetchOptions();
      self.findChildrenByRole("selectbox")[0].behave("disable")
    }});
  }

}
window.webface.component_classes["ContainerComponent"] = ContainerComponent;
