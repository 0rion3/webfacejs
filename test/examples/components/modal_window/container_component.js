import { extend_as } from '../../../lib/utils/mixin.js'
import { Component } from '../../../lib/component.js'
import { ModalWindowComponent } from '../../../lib/components/modal_window_component.js'

export class ContainerComponent extends extend_as("ContainerComponent").mix(Component).with() {
  constructor() {

    super();

    this.event_handlers.add({ event: "click", role: "show_modal_with_text", handler: (self, child) => {
      new ModalWindowComponent("hello world!");
    }});

    this.event_handlers.add({ event: "click", role: "show_modal_with_html", handler: (self, child) => {
      var el = document.createElement("b");
      el.innerText = "Hello, this is a <b> element!"
      new ModalWindowComponent(el);
    }});

    this.event_handlers.add({ event: "click", role: "show_modal_with_component", handler: (self, child) => {
      var c = self.findDescendantsByRole("modal_window_content")[0];
      c.behave("show");
      new ModalWindowComponent(c);
    }});

  }

}
window.webface.component_classes["ContainerComponent"] = ContainerComponent;
