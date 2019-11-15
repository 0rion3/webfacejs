import { extend_as } from '../../../lib/utils/mixin.js'
import { Component } from '../../../lib/component.js'

export class ContainerComponent extends extend_as("ContainerComponent").mix(Component).with() {

  constructor() {
    super();
    this.event_handlers.addForEvent("click", {
      fetch_options: (self, child) => self.selectbox.fetchOptions(),
      reset:         (self, child) => self.selectbox.reset(),
      clear:         (self, child) => self.selectbox.clear(),
      disable:       (self, child) => self.selectbox.set("disabled", true),
      enable:        (self, child) => self.selectbox.set("disabled", false),
      print_value:   (self, child) => {
        console.log(`In EditableSelectComponent --> input_value: ${self.selectbox.get("input_value")}, display_value: ${self.selectbox.get("display_value")}`);
        console.log(`In DOM                     --> input_value: ${self.selectbox.findPart("input").value}, display_value: ${self.selectbox.findPart("display_input").value}`);
      }
    });

    this.event_handlers.add({ event: "change", role: "selectbox", handler: (self, child) => {
      console.log("select value changed to", child.get("input_value"));
    }});

  }

  get selectbox() { return this.findChildrenByRole("selectbox")[0] }

}
window.webface.component_classes["ContainerComponent"] = ContainerComponent;
