import '../webface_init.js'
import { extend_as     } from '../lib/utils/mixin.js'
import { fetch_dom     } from '../test_utils.js'
import { Component     } from '../lib/component.js'
import { ComponentBehaviors } from '../lib/behaviors/component_behaviors.js'

class DummyComponent {
  constructor() {
    this.dom_element = new DOMParser().parseFromString('<div data-component-class="DummyComponent" id="dummy"></div>', "text/html").documentElement.querySelector("body>div");
  }
  findPart(name) { return this.dom_element.querySelector(name); }
}

describe("ComponentBehaviors", function() {

  var component, behaviors, dom_element;

  beforeEach(function() {
    component = new DummyComponent();
    behaviors = new ComponentBehaviors(component);
    behaviors.show_hide_animation_speed = 1;
    dom_element = component.dom_element;
    document.querySelector("body").append(dom_element);
  });

  afterEach(function() {
    dom_element.remove();
  });

  describe("showing/hiding", function() {
    
    it("hides component's dom_element", async function() {
      await behaviors.hide();
      chai.expect(dom_element.style.display).to.equal("none");
    });

    it("shows component's dom_element", async function() {
      await behaviors.hide();
      chai.expect(dom_element.style.display).to.equal("none");
      await behaviors.show();
      chai.expect(dom_element.style.display).to.equal("block")
    });

    it("toggles show/hide", async function() {
      await behaviors.toggleDisplay();
      chai.expect(dom_element.style.display).to.equal("none");
      await behaviors.toggleDisplay();
      chai.expect(dom_element.style.display).to.equal("block")
    });
    
  });

  describe("locking/unlocking", function() {
    
    it("locks the element by adding 'locked' as one of the css classes", function() {
      behaviors.lock();
      chai.expect(Array.from(dom_element.classList)).to.include("locked");
    });

    it("unlocks the element removing 'locked' from the list of css classes", function() {
      dom_element.classList.add("locked");
      behaviors.unlock();
      chai.expect(Array.from(dom_element.classList)).to.not.include("locked");
    });

    it("toggles the lock/unlock behavior", function() {
      behaviors.lock();
      chai.expect(Array.from(dom_element.classList)).to.include("locked");
      behaviors.unlock();
      chai.expect(Array.from(dom_element.classList)).to.not.include("locked");
    });

  });

  describe("enabling/disabling", function() {
    
    it("disables the element by adding 'disabled' as one of the css classes and as an attribute", function() {
      behaviors.disable();
      chai.expect(Array.from(dom_element.classList)).to.include("disabled");
      chai.expect(dom_element.hasAttribute("disabled")).to.be.true;
    });

    it("enables the element by removing 'disabled' as one of the css classes and as an attribute", function() {
      dom_element.classList.add("disabled");
      dom_element.setAttribute("disabled", "disabled")
      behaviors.enable();
      chai.expect(Array.from(dom_element.classList)).to.not.include("disabled");
      chai.expect(dom_element.hasAttribute("disabled")).to.be.false;
    });

    it("toggles the disable/enable behavior", function() {
      behaviors.toggleDisable();
      chai.expect(Array.from(dom_element.classList)).to.include("disabled");
      chai.expect(dom_element.hasAttribute("disabled")).to.be.true;
      behaviors.toggleDisable();
      chai.expect(Array.from(dom_element.classList)).to.not.include("disabled");
      chai.expect(dom_element.hasAttribute("disabled")).to.be.false;
    });

  });

  it("sets opacity to 0, but display to its original value so that we can calculate element dimensions, but not yet show it", function() {
    behaviors.displayHidden();
    chai.expect(dom_element.style.opacity).to.equal("0");
    chai.expect(dom_element.style.display).to.equal("block");
  });

  it("switches block visibility on and/off", function() {
    var block = new DOMParser().parseFromString('<div id="part"></div>', "text/html").documentElement.querySelector("body>div");
    dom_element.append(block);
    behaviors._toggleElementVisibilityIfExists("#part", "hide");
    chai.expect(block.style.display).to.equal("none");
    behaviors._toggleElementVisibilityIfExists("#part", "show");
    chai.expect(block.style.display).to.equal("block");
  });


});
