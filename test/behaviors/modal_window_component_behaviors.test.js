import '../webface_init.js'
import { fetch_dom                 } from '../test_utils.js'
import extend_as                     from '../lib/utils/mixin.js'
import ModalWindowComponentBehaviors from '../lib/behaviors/modal_window_component_behaviors.js'

describe("ModalWindowComponentBehaviors", function() {

  var behaviors;

  beforeEach(async function() {
    var component = {
      "dom_element" : (await fetch_dom("fixtures/modal_window_component.html")).querySelector("#modal_window"),
      "findPart"    : function(part_name) { return this.dom_element.querySelector(`[data-component-part=${part_name}]` )}
    };
    behaviors = new ModalWindowComponentBehaviors(component);
    behaviors.show_hide_animation_speed = 1;

    // Otherwise animations won't work!
    document.querySelector("body").appendChild(behaviors.dom_element);
  });

  after(function() {
    behaviors.dom_element.remove();
  });

  it("displays dom_element on show()", async function() {
    behaviors.dom_element.style.display = "none";
    await behaviors.show().then((r) => {
      chai.expect(behaviors.dom_element.style.display).to.eq("block");
    });
  });

  it("hides dom_element on hide() and removes itself from RootComponent", async function() {
    await behaviors.hide().then((r) => {
      chai.expect(behaviors.dom_element.style.display).to.eq("none");
    });
  });

  it("hides the close button", function() {
    chai.expect(behaviors.component.findPart("close")).to.not.be.null;
    behaviors.hideCloseButton();
    chai.expect(behaviors.component.findPart("close")).to.be.null;
  });

});
