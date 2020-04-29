import extend_as                  from '../utils/mixin.js'
import Component                  from '../component.js'
import CheckboxComponentBehaviors from '../behaviors/checkbox_component_behaviors.js'

export default class CheckboxComponent extends extend_as("CheckboxComponent").mix(Component).with() {

  static get behaviors() { return [CheckboxComponentBehaviors]; }

  get value() {
    return this.get("checked") == "checked" || this.get("checked");
  }

  set value(v) {
    this.set("checked", v);
  }

  constructor() {
    super();

    this.native_events            = ["change"];
    this.attribute_names          = ["name", "disabled", "checked"];
    this.default_attribute_values = { "disabled": false, "checked": false };

    this.event_handlers.add({ event: "change", handler: (self, event) => {
      self.set("checked", event.target.checked);
    }});

    this.attribute_callbacks["checked"] = function(attr_name, self) {
      if(self.get("checked"))
        self.behave("check");
      else
        self.behave("uncheck");
    };
  }

  afterInitialize() {
    super.afterInitialize();
    this.updateAttrsFromNodes({ attrs: ["name", "checked", "disabled"], run_callback: false });
  }

}
window.webface.component_classes["CheckboxComponent"] = CheckboxComponent;
