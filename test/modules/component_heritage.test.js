import '../webface_init.js'
import { extend_as    } from '../lib/utils/mixin.js'
import { fetch_dom    } from '../test_utils.js'
import { Attributable } from '../lib/modules/attributable.js'
import { ComponentDom } from '../lib/modules/component_dom.js'
import { Heritable    } from '../lib/modules/heritable.js'
import { ComponentHeritage } from '../lib/modules/component_heritage.js'

class DummyComponent extends extend_as("DummyComponent").mixins(Attributable,ComponentDom,Heritable,ComponentHeritage) {
  afterInitialize()         {}
  publishEvent(e)           {}
  _addValidationsToChild(c) {}
  addObservingSubscriber(c) {}
  hello(a,b)                {}
}
window.webface.component_classes["DummyComponent"] = DummyComponent;
class DummyComponent2 extends DummyComponent {}
window.webface.component_classes["DummyComponent2"] = DummyComponent2;
class DummyComponent3 extends DummyComponent {}
window.webface.component_classes["DummyComponent3"] = DummyComponent3;

var dom;
var dummy;

describe('ComponentHeritage', function() {

  beforeEach(async function() {
    dom    = await fetch_dom("fixtures/component_heritage.html");
    dummy  = new DummyComponent();
    dummy.dom_element = dom;
  });

  describe("initializing child components", function() {

    it("creates new instances of correposnding JS classes for each found element that has data-component-class attr", function() {
      dummy.initChildComponents();
      chai.expect(dummy.children[0].constructor.name).to.equal("DummyComponent2");
      chai.expect(dummy.children[0].children[0].constructor.name).to.equal("DummyComponent3");
    });

    it("ignores components for which no JS classes exist, but logs the error as WARN", function() {
      dummy.initChildComponents();
      chai.expect(window.webface.logger.last_error.message).to.include("`DummyComponent4` not found");
      chai.expect(window.webface.logger.last_error.log_level).to.include("WARN");
    });

    it("runs afterInitialize() function for each initialized component", function() {
      var spy = chai.spy.on(dummy, "afterInitialize");
      dummy.initChildComponents();
      chai.expect(spy).to.have.been.called.once;
    });

    it("publishes the 'initialized' event", function() {
      var spy = chai.spy.on(dummy, "publishEvent");
      dummy.initChildComponents();
      chai.expect(spy).to.have.been.called.with("initialized").once;
    });

  });


  describe("traversing children and ancestors", function() {

    beforeEach(function() {
      dummy.initChildComponents();
    });

    it("finds all immediate children with a particular role", function() {
      chai.expect(dummy.findChildrenByRole("role1")).to.have.lengthOf(2);
    });

    it("finds first child with a particular role", function() {
      chai.expect(dummy.findFirstChildByRole("role1")).to.eq(dummy.children[0]);
    });

    it("finds all descendants by role", function() {
      chai.expect(dummy.findAllDescendantsByRole("role1")).to.have.lengthOf(3);
      chai.expect(dummy.findAllDescendantsByRole("role2")).to.have.lengthOf(2);
    });

    it("finds descendants by role path", function() {
      chai.expect(dummy.findDescendantsByRolePath(["role1", "role3"])).to.have.lengthOf(2);
    });

    it("finds descendants by role with wildcards and .", function() {
      chai.expect(dummy.findDescendantsByRole("role1.role3")).to.have.lengthOf(2);
      chai.expect(dummy.findDescendantsByRole("role2.role1.role4")).to.have.lengthOf(1);
      chai.expect(dummy.findDescendantsByRole("role1.role2.role4")).to.have.lengthOf(0);
      chai.expect(dummy.findDescendantsByRole("*.role3")).to.have.lengthOf(2);
      chai.expect(dummy.findDescendantsByRole("*.role1")).to.have.lengthOf(3);
    });
    
  });

  describe("adding child component", function() {

    var dummy_child;

    beforeEach(function() {
      dummy_child = new DummyComponent2();
      dummy_child.template = new DOMParser().parseFromString('<div data-component-template="DummyComponent2">child el</div>', "text/xml").documentElement;
    });

    it("adds child to the current component's dom_element and heritage tree", function() {
      dummy.addChild(dummy_child);
      chai.expect(dummy.children.slice(-1)[0].dom_element.innerHTML).to.equal("child el");
      chai.expect(dummy.dom_element.innerHTML).to.include("child el");
    });

    it("calls addObservingSubscriber to add parent as observer when adding a new child", function() {
      var spy = chai.spy.on(dummy_child, "addObservingSubscriber");
      dummy.addChild(dummy_child);
      chai.expect(spy).to.have.been.called.with(dummy).once;
    });

    it("calls _appendChildDomElement on the parent class, but only if child isn't in the DOM yet", function() {
      var spy = chai.spy.on(dummy, "_appendChildDomElement");
      dummy.addChild(dummy_child);
      dummy.addChild(dummy_child);
      chai.expect(spy).to.have.been.called.once;
    });

    it("calls afterInitialize(), unless a flag is passed that prevents it", function() {
      var spy = chai.spy.on(dummy_child, "afterInitialize");
      dummy.addChild(dummy_child);
      dummy.addChild(dummy_child, { initialize: false });
      chai.expect(spy).to.have.been.called.once;
    });
    
  });

  describe("calling a method on all children", function() {

    var spies = [];
  
    beforeEach(function() {
      spies = [];
      dummy.initChildComponents();
      dummy.children.forEach(function(c) {
        spies.push(chai.spy.on(c, "hello"));
      });
    });

    it("calls a method on all children if this method exists", function() {
      dummy.applyToChildren("hello", { args: [1,2] });
      spies.forEach(function(s) {
        chai.expect(s).to.have.been.called.with(1,2).once;
      });
    });

    it("skips calling a method on a child if it doesn't exist", function() {
      dummy.applyToChildren("hello2", { args: [1,2] });
      // no checks here, just making sure no errors are raised
    });

    it("only calls a method on a child if the condition function returns true", function() {
      dummy.applyToChildren("hello", { args: [1,2], recursive: false, condition: function() { return true; }});
      dummy.applyToChildren("hello", { args: [1,2], recursive: false, condition: function() { return false; }});
      spies.forEach(function(s) {
        chai.expect(s).to.have.been.called.with(1,2).once;
      });
    });

    it("calls a method on the whole descedant tree if recursive is set to true", function() {
      var spy = chai.spy.on(dummy.children[2].children[0], "hello");
      dummy.applyToChildren("hello", { args: [1,2], recursive: true });
      chai.expect(spy).to.have.been.called.with(1,2).once;
    });

  });


});
