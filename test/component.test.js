import '../webface_init.js'
import { extend_as          } from '../lib/utils/mixin.js'
import { fetch_dom          } from '../test_utils.js'
import { Component          } from './lib/component.js'
import { ComponentBehaviors } from './lib/behaviors/component_behaviors.js'

class DummyBehaviors extends ComponentBehaviors {
  hello() { return "hello"; }
}

class DummyComponent extends extend_as("DummyComponent").mix(Component).with() {
  static get behaviors() { return [DummyBehaviors]; }
  constructor(attrs=null) {
    super(attrs);
    this.attribute_names = ["caption", "attr1", "attr2", "*non_dom_attr"];
    this.display_states =  [[ { attr1: "value1" }, "some_entity" ]];
  }
}

class RootComponent extends extend_as("RootComponent").mix(Component).with() {}

describe("Component", function() {

  var component, dom;

  beforeEach(async function() {
    dom = await fetch_dom("fixtures/component.html");
    DummyComponent.owner_document = dom;
    component = new DummyComponent();
    component.dom_element = dom.querySelector('[data-component-class="DummyComponent"]');
  });

  describe("behaviors", function() {

    beforeEach(function() {
      component._createBehaviors();
    });

    it("instantiates behavior instances", function() {
      chai.expect(component.behavior_instances).to.have.lengthOf(1);
    });

    it("calls a method in each behavior instance associated with the component", function() {
      chai.expect(component.behave("hello")).to.equal("hello");
    });

    it("silently ignores the behavior if it doesn't exist and Component#ignore_misbehavior is set to false", function() {
      chai.expect(component.behave("hello1")).to.equal(undefined);
      component.ignore_misbehavior = false;
      chai.expect( () => component.behave("hello1")).to.throw();
    });

  });

  describe("I18n", function() {

    beforeEach(function() {
      var dummy_component_json_data = '{ "l1" : { "l2" : { "l3" : "ok", "with_placeholder": "placeholder is %x" }}}'
      var component_json_data = '{ "l4" : { "l5" : { "l6" : "ok" }}}'
      var body = `<body><div id='i18n_DummyComponent_data_holder' data-i18n-json='${dummy_component_json_data}\'></div>` +
                 `<div id='i18n_Component_data_holder' data-i18n-json='${component_json_data}\'></div></body>`
      var doc = new DOMParser().parseFromString(body, "text/xml");
      component._loadI18n(doc);
    });

    it("loads i18n translations for all components that descend from Component class and for itself", function() {
      chai.expect(window.webface.components_i18n["DummyComponent"].names).to.eql(["i18n_Component", "i18n_DummyComponent"]);
    });

    it("finds translations", function() {
      chai.expect(component.t("l1.l2.l3")).to.equal("ok");
      chai.expect(component.t("l4.l5.l6")).to.equal("ok");
      chai.expect(component.t("l1.l2.with_placeholder", { "x" : "HELLO" })).to.equal("placeholder is HELLO");
    });

    it("displays a console warning if translation isn't found and returns the original key as a translation", function() {
      chai.expect(component.t("l1.l2.l4")).to.equal("l4");
      chai.expect(window.webface.logmaster_print_spy).to.be.called.with("translation missing for \"l1.l2.l4\" in \"DummyComponent\" translator(s).", "WARN");
    });

  });

  describe("attribute callbacks", function() {

    it("invokes the default callback and sets attribute value to the corresponding DOM element's text content", function() {
      component.set("caption", "new value");
      chai.expect(component.dom_element.querySelector('[data-component-attr="caption"]').textContent).to.equal("new value");
    });

    it("for attributes that are marked as non-DOM it doesn't write values to DOM with default callback", function() {
      component.afterInitialize(); // calls _prepareNonDomAttrs() which adds all attribute names marked with * to non_dom_attribute_names
      component.set("non_dom_attr", "some value");
      chai.expect(component.dom_element.attributes["data-non-dom-attr"]).to.be.undefined;
    });

  });

  describe("removing a component", function() {

    var child;

    beforeEach(function() {
      child = new DummyComponent();
      component.addChild(child);
    });

    it("removes component from the parent's children list and its dom_element from the DOM", function() {
      chai.expect(component.children).to.include(child);
      child.remove();
      chai.expect(component.children).to.not.include(child);
    });

    it("calls remove() on each of its children too if 'deep' flag is passed", function() {
      var child2 = new DummyComponent();
      var child3 = new DummyComponent();
      child.addChild(child2);
      child.addChild(child3);
      chai.expect(child.children).to.include(child2);
      chai.expect(child.children).to.include(child3);
      child.remove({ deep: true });
      chai.expect(child.children).to.be.empty;
    });

    it("removes its DOM element from the document", function() {
      child.dom_element.setAttribute("id", "child_component");
      child.remove();
      chai.expect(component.dom_element.querySelector("#child_component")).to.be.null;
    });
    
  });

  describe("capturing events", function() {

    var spy, child;

    beforeEach(function() {
      spy = chai.spy();
      child = new DummyComponent();
      child.event_handlers.add({ event: "event1", handler: spy });
      component.addChild(child);
    });
    
    it("applies the handler for the event", function() {
      child.captureEvent("event1", ["#self"]);
      chai.expect(spy).to.be.called.once;
    });

    it("publishes the event to the parent", function() {
      child.roles.push("child_role_1");
      component.event_handlers.add({ event: "event1", role: "child_role_1", handler: spy });
      child.captureEvent("event1", ["#self"]);
      chai.expect(spy).to.be.called.twice;
    });

    it("prevents the native event", function() {
      var mouse_event = document.createEvent('MouseEvent');
      mouse_event.initMouseEvent("mousedown");
      var mouse_spy = chai.spy.on(mouse_event, "preventDefault");
      child.event_handlers.add({ event: "mousedown", handler: function() {} });
      child.captureEvent(mouse_event, ["#self"], { prevent_default: true, is_native: true });
      chai.expect(mouse_spy).to.have.been.called.once;
    });

    it("adds event lock and disallows further invokation of handles for the same event, including the native event handler", function() {
      var mouse_event = document.createEvent('MouseEvent');
      mouse_event.initMouseEvent("mousedown");
      var mouse_spy = chai.spy.on(mouse_event, "preventDefault");
      child.event_handlers.add({ event: "mousedown", handler: spy });
      child.event_lock_for.add("mousedown");
      child.captureEvent(mouse_event, ["#self"], { is_native: true });
      child.captureEvent(mouse_event, ["#self"], { is_native: true });
      chai.expect(spy).to.have.been.called.once;
      chai.expect(mouse_spy).to.have.been.called.once;
    });

    it("passes the native event to the handler instead of the Component itself when a native event is handled", function() {
      var passed_obj;
      var mousedown_event = new MouseEvent("mousedown");
      child.roles.push("child_role_1");
      child.native_events.push("mousedown");
      child._listenToNativeEvents();
      child.event_handlers.add({ event: "mousedown", handler: function() {}});
      component.event_handlers.add({ event: "mousedown", role: "child_role_1", handler: (self,e) => passed_obj=e, options: { "pass_native_event_object": true }});
      child.dom_element.dispatchEvent(mousedown_event);
      chai.expect(passed_obj instanceof Event).to.be.true;
    });

    it("captures its own event and runs the handler for it when one is published", function() {
      component.event_handlers.add({ event: "mousedown", role: "#myself", handler: spy });
      component.publishEvent("mousedown");
      chai.expect(spy).to.have.been.called.once;
    });

  });

  describe("listening to native events", function() {

    var spy;

    beforeEach(function() {
      component.native_events = ["mousedown", "!mouseup", "part1.click", "!part2.[mouseup, mousedown]", component.click_event];
      // Calling this method again here even though it's automatically called
      // when a Component#dom_element is assigned. We added #native_events and #event_handlers later,
      // so we need to re-listen to native events.
      component._listenToNativeEvents();
    });

    it("captures the native events from the component's dom_element", function() {
      var e = new MouseEvent("mousedown");
      var spy = chai.spy();
      component.event_handlers.add({ event: "mousedown", handler: spy });
      component.dom_element.dispatchEvent(e);
      chai.expect(spy).to.have.been.called.once;
    });

    it("listens and captures events from component parts", function() {
      var e = new MouseEvent("click");
      var spy = chai.spy();
      component.event_handlers.add({ event: "click", role: "self.part1", handler: spy });
      component.findPart("part1").dispatchEvent(e);
      chai.expect(spy).to.have.been.called.once;
    });

    it("doesn't prevent default native events handler if it sees ! (exclamation mark) in front of the event name", function() {
      var mouseup_event   = new MouseEvent("mouseup");
      var mousedown_event = new MouseEvent("mousedown");
      var mouseup_spy     = chai.spy.on(mouseup_event, "preventDefault");
      var mousedown_spy   = chai.spy.on(mousedown_event, "preventDefault");
      component.event_handlers.add({ event: "mouseup",   handler: function() {} });
      component.event_handlers.add({ event: "mousedown", handler: function() {} });
      component.dom_element.dispatchEvent(mouseup_event);
      component.dom_element.dispatchEvent(mousedown_event);
      chai.expect(mouseup_spy).not.to.have.been.called.once;
      chai.expect(mousedown_spy).to.have.been.called.once;
    });

    it("flattens native events", function() {
      var mouseup_event         = new MouseEvent("mouseup");
      var mousedown_event       = new MouseEvent("mousedown");
      var mouseup_spy           = chai.spy.on(mouseup_event, "preventDefault");
      var mousedown_spy         = chai.spy.on(mousedown_event, "preventDefault");
      var mouseup_handler_spy   = chai.spy();
      var mousedown_handler_spy = chai.spy();
      component.event_handlers.add({ event: "mouseup", role: "self.part2",   handler: mouseup_handler_spy   });
      component.event_handlers.add({ event: "mousedown", role: "self.part2", handler: mousedown_handler_spy });
      component.findPart("part2").dispatchEvent(mouseup_event);
      component.findPart("part2").dispatchEvent(mousedown_event);
      chai.expect(mouseup_spy).not.to.have.been.called.once;
      chai.expect(mousedown_spy).not.to.have.been.called.once;
      chai.expect(mouseup_handler_spy).to.have.been.called.once;
      chai.expect(mousedown_handler_spy).to.have.been.called.once;
      chai.expect(component.native_events).to.include("mousedown", "!mouseup", "part1.click", "!part2.mouseup", "!part2.mousedown", "click");
      if(component.click_event.includes("touchend"))
        chai.expect(component.native_events).to.include("touchend");
    });

    it("cancels an event listener based on a name", function() {
      var mouseup_event         = new MouseEvent("mouseup");
      var mousedown_event       = new MouseEvent("mousedown");
      var mouseup_handler_spy   = chai.spy();
      var mousedown_handler_spy = chai.spy();
      component.event_handlers.add({ event: "mouseup", role: "self.part2", handler: mousedown_handler_spy });
      component.event_handlers.add({ event: "mousedown", handler: mousedown_handler_spy });
      component._cancelNativeEventListenerFor("mousedown");
      component._cancelNativeEventListenerFor("!part2.mouseup");

      component.dom_element.dispatchEvent(mousedown_event);
      component.findPart("part2").dispatchEvent(mouseup_event);

      chai.expect(mousedown_handler_spy).not.to.have.been.called.once;
      chai.expect(mouseup_handler_spy).not.to.have.been.called.once;
      chai.expect(Object.keys(component.native_event_handlers)).not.to.include("part2.mouseup");
      chai.expect(Object.keys(component.native_event_handlers)).not.to.include("mousedown");
    });

    it("cancels all native event listeners", function() {
      component._cancelNativeEventListeners();
      chai.expect(component.native_event_handlers).to.be.empty;
    });

    it("cancels some native event listeners", function() {
      component._cancelNativeEventListeners(["part2.mouseup", "mousedown"]);
      component._cancelNativeEventListeners("mouseup");
      chai.expect(Object.keys(component.native_event_handlers)).not.to.include("part2.mouseup");
      chai.expect(Object.keys(component.native_event_handlers)).not.to.include("mousedown");
      chai.expect(Object.keys(component.native_event_handlers)).not.to.include("mouseup");
      chai.expect(component.native_event_handlers).not.to.be.empty;
    });

    it("cancels event listeners for all component parts that have the same name", function() {
      let mouseup_handler_spy = chai.spy();
      component.event_handlers.add({ event: "mouseup", role: "self.part2", handler: mouseup_handler_spy });
      component.findAllParts("part2").forEach((el) => {
        el.dispatchEvent(new MouseEvent("mouseup"));
      });
      component._cancelNativeEventListeners();
      component.findAllParts("part2").forEach((el) => {
        el.dispatchEvent(new MouseEvent("mouseup"));
      });
      chai.expect(Object.keys(component.native_event_handlers)).not.to.include("mouseup");
      chai.expect(mouseup_handler_spy).to.have.been.called.twice;
    });

  });

  describe("creating component from a template", function() {

    var root;

    beforeEach(function() {
      root  = new RootComponent();
      RootComponent.instance = root;
      root.dom_element = dom;
      window.webface["root_component"] = root;
    });

    it("creates a dom element from a template with a custom name", function() {
      var dummy1 = DummyComponent.createFromTemplate({ container: root });
      var dummy2 = DummyComponent.createFromTemplate({ template_name: "custom_dummy", container: root });
      chai.expect(dummy1.findPart("part1").innerText).to.equal("part1");
      chai.expect(dummy2.findPart("custom_dummy_part").innerText).to.equal("custom dummy part");
    });

    it("assigns attrs to html attrs (skipping the undefeined ones), then reads attrs values from DOM", function() {
      var dummy = DummyComponent.createFromTemplate({ container: root, attrs: { attr1: "hi" }});
      chai.expect(dummy.get("attr1")).to.equal("hi");
      chai.expect(dummy.get("attr2")).to.equal("hello");
    });

    it("uses RootComponent as a default parent to assign to", function() {
      var dummy = DummyComponent.create();
      chai.expect(RootComponent.instance.children).to.include(dummy);
    });

  });

  describe("changing display state with DisplayStateManager", function() {

    var spy;

    beforeEach(function() {
      component.afterInitialize();
      spy = chai.spy.on(component.display_state_manager, "applyAction");
    });

    it("calls DisplayStateManager.applyAction() whenever an attribute changes", async function() {
      component.set("attr1", "value1");
      await component.display_state_manager.last_promise;
      chai.expect(spy).to.have.been.called.twice;
    });

    it("calls DisplayStateManager.applyAction() only twice (to hide and show entities) when attributes are called with updateAttributes()", async function() {
      component.updateAttributes({ caption: "value", attr1: "value1", attr2: "value2" });
      await component.display_state_manager.last_promise;
      chai.expect(spy).to.have.been.called.twice;
    });

    it("doesn't call DisplayStateManager.applyAction() upon updateAttributes() call if callback option is set to false", async function() {
      component.updateAttributes({ attr1: "value1", attr2: "value2" }, { callback: false });
      await component.display_state_manager.last_promise;
      chai.expect(spy).to.not.have.been.called.twice;
    });

  });

  describe("publishing the 'change' event when attributes change", function() {

    var spy;

    beforeEach(function() {
      component.publish_changes_for = ["attr1", "attr2"];
      component.roles = ["role1"];
      component.change_event_called = 0;
      component.event_handlers.add({ event: "change", role: "role1", handler: (self) => {
        self.change_event_called += 1;
      }});
      component.addObservingSubscriber(component);
      spy = chai.spy.on(component, "captureEvent");
    });

    it("publishes the 'change' event when an individual attribute is changed", function() {
      component.set("attr1", "new value");
      chai.expect(component.change_event_called).to.equal(1);
    });

    it("publishes the 'change' event once when attributes are changed through updateAttributes()", function() {
      component.updateAttributes({ attr1: "new value", attr2: "new value"});
      chai.expect(component.change_event_called).to.equal(1);
    });

    it("doesn't publish the 'change' event if the changed attribute is not in the publish_changes_for array", function() {
      component.set("caption", "new value");
      chai.expect(component.change_event_called).to.equal(0);
    });

    it("publishes changes whenever any attribute changes if publish_changes_for is set to '#all'", function() {
      component.publish_changes_for = "#all";
      component.updateAttributes({ caption: "new value" });
      chai.expect(component.change_event_called).to.equal(1);
    });

  });

  it("gets root component", function() {
    var child = new DummyComponent();
    var root  = new RootComponent();
    component.addChild(child);
    root.addChild(component);
    chai.expect(child.root_component).to.equal(root);
    chai.expect(component.root_component).to.equal(root);
    chai.expect(root.root_component).to.equal(root);
  });

});
