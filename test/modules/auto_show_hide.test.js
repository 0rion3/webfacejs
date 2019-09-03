import '../webface_init.js'
import { extend_as }    from '../lib/utils/mixin.js'
import { AutoShowHide } from '../lib/modules/auto_show_hide.js'
import { Component }    from '../lib/component.js'
import { ComponentBehaviors }    from '../lib/behaviors/component_behaviors.js'

export class MyComponent extends extend_as("MyComponent").mix(Component).with(AutoShowHide) {

  static get behaviors() { return [ComponentBehaviors]; }
  
  constructor() {
    super();
    this.attribute_names = ["autohide_delay", "autoshow_delay"];
  }

  hide() { return this.behave("hide") };
  show() { return this.behave("show") };

}

describe("autohideshow", function() {

  var component;

  beforeEach(function() {
    component = new MyComponent();
    component.dom_element = document.createElement("div");
    component.afterInitialize();
    component.set("autohide_delay", 1);
    component.set("autoshow_delay", 1);
  });

  it("autohides component", async function() {
    await component.autohide();
    component.autohide_promise.then((result) => {
      chai.expect(result[0]).to.equal("hide behavior resolved");
    });
  });

  it("autoshows component", async function() {
    await component.autoshow();
    component.autoshow_promise.then((result) => {
      chai.expect(result[0]).to.equal("show behavior resolved");
    });
  });

});
