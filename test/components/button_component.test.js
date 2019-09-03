import '../webface_init.js'
import { extend_as       } from '../lib/utils/mixin.js'
import { fetch_dom       } from '../test_utils.js'
import { ButtonComponent } from '../lib/components/button_component.js'

describe("ButtonComponent", function() {

  var button, dom, spy;
  var click_event = new MouseEvent("click", { bubbles: true });

  beforeEach(async function() {
    dom = (await fetch_dom("fixtures/button_component.html")).querySelector("div");
    button = new ButtonComponent();
    button.dom_element = dom;
    button.afterInitialize();
  });

  it("calls lock() behavior on a click if the button is lockable", function() {
    spy = chai.spy.on(button, "behave");
    button.dom_element.dispatchEvent(click_event);
    chai.expect(spy).to.have.been.called.with('lock');
  });

  it("doesn't call lock() behavior on a click if the button is unlockable", function() {
    spy = chai.spy.on(button, "behave");
    button.set("lockable", "false");
    button.dom_element.dispatchEvent(click_event);
    chai.expect(spy).not.to.have.been.called.with('lock');
  });

  it("doesn't use the click event lock if button is unlockable", function() {
    button.set("lockable", false);
    button.afterInitialize();
    button.dom_element.dispatchEvent(click_event);
    chai.expect(button.event_locks.has("click")).to.be.false;
  });

  it("removes the event lock for click_event after button is unlocked", function() {
    button.click_event    = ["click", "touchend"];
    button.native_events  = ["click", "touchend"];
    button.event_lock_for = ["click", "touchend"];
    button.dom_element.dispatchEvent(click_event);
    chai.expect(button.event_locks).to.include("click");
    chai.expect(button.event_locks).to.include("touchend");
    button.behave("unlock");
    chai.expect(button.event_locks).not.to.include("click");
    chai.expect(button.event_locks).not.to.include("touchend");
  });

});
