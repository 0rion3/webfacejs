import '../webface_init.js'
import { extend_as     } from '../lib/utils/mixin.js'
import { fetch_dom     } from '../test_utils.js'
import { ButtonComponentBehaviors } from '../lib/behaviors/button_component_behaviors.js'

describe("ButtonComponentBehaviors", function() {

  var behaviors;

  beforeEach(async function() {
    var component = { "dom_element" : await fetch_dom("fixtures/button_component.html"), "click_event" : ["click", "touchend"] };
    behaviors = new ButtonComponentBehaviors(component);
  });

  it("adds 'disabled=disabled' attribute to the dom_element on #disable behavior", function() {
    behaviors.disable();
    chai.expect(behaviors.dom_element.getAttribute("disabled")).to.equal("disabled");
  });

  it("removes 'disabled' attribute from the dom_element on #enable behavior", function() {
    behaviors.disable();
    behaviors.enable();
    chai.expect(behaviors.dom_element.getAttribute("disabled")).to.be.null;
  });

  it("removes the event lock for the click event #unlock behavior", function() {
    var spy = chai.spy.on(behaviors.component, "removeEventLock");
    behaviors.unlock();
    chai.expect(spy).to.have.been.called.with(["click", "touchend"]);
  });

});
