import '../webface_init.js'
import { extend_as     } from '../lib/utils/mixin.js'
import { fetch_dom     } from '../test_utils.js'
import { Component     } from '../lib/component.js'
import { RootComponent } from '../lib/components/root_component.js'

class DummyComponent extends extend_as("DummyComponent").mix(Component).with() {
  constructor() { super(); }
  externalClickCallback() {}
}
window.webface.component_classes["DummyComponent"] = DummyComponent;

describe("RootComponent", function() {

  var root, dom;

  beforeEach(async function() {
    dom = await fetch_dom("fixtures/root_component.html");
    RootComponent.owner_document = dom;
    root = new RootComponent();
    root.dom_element = dom;
    root.initChildComponents();
  });

  it("invokes externalClickCallback() on all children components except the one that triggered it", function() {

    var child1      = root.children[0];
    var child2      = root.children[1];
    child1.native_events = ["!click"];
    child2.native_events = ["!click"];
    child2._listenToNativeEvents();

    var spy         = chai.spy.on(child1, "externalClickCallback");
    var click_event = new MouseEvent("click", { bubbles: true });

    root.dom_element.dispatchEvent(click_event);
    child2.dom_element.dispatchEvent(click_event);
    child2.findPart("part1").dispatchEvent(click_event);
    child1.dom_element.dispatchEvent(click_event);
    chai.expect(spy).to.have.been.called.exactly(3);

  });

  it("loads global i18n", function() {
    root._loadI18n(root.dom_element);
    chai.expect(root.t("l1.l2.l3")).to.equal("ok");
  });

});
