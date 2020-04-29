import extend_as                from '../utils/mixin.js'
import Component                from '../component.js'
import ButtonComponent          from '../components/button_component.js'
import DialogWindowComponent    from '../components/dialog_window_component.js'
import ButtonComponentBehaviors from '../behaviors/button_component_behaviors.js'

export default class ConfirmableButtonComponent extends extend_as("ConfirmableButtonComponent").mix(ButtonComponent).with() {

  static get behaviors() { return [ButtonComponentBehaviors]; }


  constructor() {

    super();

    this.attribute_names = ["caption", "disabled", "lockable", "confirmation", "prevent_native_click_event"];

    this.event_handlers.add({ event: this.click_event, role: "#self", handler: (self,event) => {
      event.preventDefault();
      new DialogWindowComponent(self.get("confirmation"), {
        "yes" : { "caption": self.t("_yes"), "type" : "red", "value": true  },
        "no"  : { "caption": self.t("_no"),  "type" : null,  "value": false }
      }).promise.then((r) => {
        if(r) {
          self.publishEvent("click_and_confirm");
          // Takes care of cases when button is a submit button to a form!
          if (event.target.getAttribute("type") === "submit") {
            let ancestor = event.target;
            while (ancestor != null && ancestor.tagName && ancestor.tagName.toLowerCase() != "form")
              ancestor = ancestor.parentElement;
            if (ancestor != null) ancestor.submit();
          }
        } else {
          self.publishEvent("click_and_deny");
          this.behave("unlock");
        }
      });
    }});

  }

  afterInitialize() {
    super.afterInitialize();
    this.updateAttrsFromNodes({ attrs: ["confirmation", "disabled", "lockable"] });
  }

}
window.webface.component_classes["ConfirmableButtonComponent"] = ConfirmableButtonComponent;
