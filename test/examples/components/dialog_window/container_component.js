import { extend_as } from '../../../lib/utils/mixin.js'
import { Component } from '../../../lib/component.js'
import { DialogWindowComponent } from '../../../lib/components/dialog_window_component.js'

export class ContainerComponent extends extend_as("ContainerComponent").mix(Component).with() {
  constructor() {

    super();

    this.event_handlers.add({ event: "click", role: "show_dialog_with_text", handler: (self, child) => {
      var dw = new DialogWindowComponent("Do you like Webface?", {
        "yes" : { "caption": "Yes", "type": "green", "value": "YES CLICKED" },
        "no" :  { "caption": "No",  "type": "blue",  "value": "NO CLICKED"  }
      });
      dw.promise.then((value) => console.log(value));
    }});

    this.event_handlers.add({ event: "click", role: "show_dialog_with_html", handler: (self, child) => {
      var el = document.createElement("b");
      el.innerText = "Hello, this is a <b> element!"
      var dw = new DialogWindowComponent(el, {
        "yes" : { "caption": "Yes", "type": "green", "value": "YES CLICKED" },
        "no" :  { "caption": "No",  "type": "blue",  "value": "NO CLICKED"  }
      });
      dw.promise.then((value) => console.log(value));
    }});

  }

}
window.webface.component_classes["ContainerComponent"] = ContainerComponent;
