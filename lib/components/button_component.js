import { extend_as } from '../utils/mixin.js'
import { Component } from '../component.js'
import { ButtonComponentBehaviors } from '../behaviors/button_component_behaviors.js'

export class ButtonComponent extends extend_as("ButtonComponent").mix(Component).with() {

  static get behaviors() { return [ButtonComponentBehaviors]; }

  constructor() {
    super();
    this.attribute_names          = ["caption", "disabled", "lockable", "prevent_native_click_event"];
    this.event_lock_for           = [this.click_event];
    this.default_attribute_values = { "lockable": true, "disabled": false, "prevent_native_click_event": true };
  }

  afterInitialize() {
    super.afterInitialize();

    this.event_handlers.add({ event: this.click_event, role: "#self", handler: (self,event) => {
      if(event.constructor.name != "MouseEvent") {
        // let's trigger a native click event
        let e = new MouseEvent("click", { bubbles: true });
        self.dom_element.dispatchEvent(e);
      } else if(self.get("lockable") == true) {
        self.behave("lock");
        self.addEventLock(self.click_event);
      }
    }});

    this.attribute_callbacks["disabled"] = (attr_name,self) => {
      if(self.get("disabled"))
        this.behave("disable");
      else
        this.behave("enable");
    };

    this.updateAttrsFromNodes({ attrs: ["lockable", "disabled", "prevent_native_click_event"], run_callback: true });

    if(this.get("lockable") == false)
      this.click_event.forEach(e => this._event_lock_for.delete(e));

    // Allowing default click events to not be prevented is useful for buttons, which are links.
    if(!this.get("prevent_native_click_event"))
      this.native_events = [this.click_event.map((e) => `!${e}`)];
    else
      this.native_events = [this.click_event];
    this._listenToNativeEvents();
  }

}
window.webface.component_classes["ButtonComponent"] = ButtonComponent;
