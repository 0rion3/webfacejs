import extend_as from '../../../lib/utils/mixin.js'
import Component from '../../../lib/component.js'

export class StatesExampleComponent extends extend_as("StatesExampleComponent").mix(Component).with() {
  constructor() {
    super();

    this.attribute_names = ["attr1", "attr2", "attr3", "age", "country"];

    this.native_events = ["save_changes.click"];
    this.event_handlers.add({ event: "click", role: "self.save_changes", handler: () => {
      this.updateAttrsFromNodes({ run_callback: true });
    }});

    this.states = [

      "aliases", {
        can_drink: [
          { country: "United States",                     age: { more_than: 20 }},
          { country: { not_in: ["United States", null] }, age: { more_than: 17 }}
        ],
      },

      "action", {},
      [{ attr1: "qwerty" }, { in: () => console.log("attr1 is set to qwerty!") }],
      [{ attr1: "say hi" }, "helloToConsole,helloAsAlert"],
      [{ attr1: "say bye" }, { in: [() => console.log("Bye!"), () => alert("Bye!")] }],
      [{ attr1: () => this.get("attr2") }, { in: () => console.log("attr1 == attr2, their value is: ", this.get("attr1")) }],

      "display", { debug: { log: true, exit_states: true, enter_states: true, transitions: true }},
      [{ country: "United States" }, "can_buy_alcohol"]
    ];

  }

  afterInitialize() {
    super.afterInitialize();
    this.state_dispatcher.applyTransitions();
  }

  helloToConsole() {
    console.log("Hello!")
  }

  helloAsAlert() {
    alert("Hello!")
  }

}
window.webface.component_classes["StatesExampleComponent"] = StatesExampleComponent;
