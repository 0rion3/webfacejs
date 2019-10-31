import { extend_as } from '../../../lib/utils/mixin.js'
import { Component } from '../../../lib/component.js'

export class ContainerComponent extends extend_as("ContainerComponent").mix(Component).with() {

  constructor() {
    super();
    this.event_handlers.addForEvent("click", {
      fetch_options: (self, child) => self.findChildrenByRole("selectbox")[0].fetchOptions(),
      reset:         (self, child) => self.findChildrenByRole("selectbox")[0].reset(),
      clear:         (self, child) => self.findChildrenByRole("selectbox")[0].clear()
    });

    this.event_handlers.add({ event: "change", role: "selectbox", handler: (self, child) => {
      console.log("select value changed");
    }});
  }

}
window.webface.component_classes["ContainerComponent"] = ContainerComponent;
