import '../webface_init.js'
import { fetch_dom        } from '../test_utils.js'
import extend_as            from '../lib/utils/mixin.js'
import RootComponent        from '../lib/components/root_component.js'
import ContextMenuComponent from '../lib/components/context_menu_component.js'
import Cookies              from '../lib/utils/cookies.js'

describe("ContextMenuComponent", function() {

  var menu, root, dom;

  var click_event     = new MouseEvent("click",     { bubbles: true });
  var mouseover_event = new MouseEvent("mouseover", { bubbles: true });

  beforeEach(async function() {

    dom = (await fetch_dom("fixtures/context_menu_component.html")).querySelector("#root");
    root = new RootComponent();
    root.dom_element = dom;
    root.initChildComponents();
    menu = root.findChildrenByRole("context_menu")[0];

    // Otherwise animations won't work!
    document.querySelector("body").appendChild(dom);

  });

  afterEach(function() {
    menu.remove();
    dom.remove();
  });

  it("listens to all specified events on all specified anchors", function() {
    var spy = chai.spy.on(menu, "show");
    dom.querySelector("#anchor1").dispatchEvent(click_event);
    dom.querySelector("#anchor1").dispatchEvent(mouseover_event);
    dom.querySelector("#anchor2").dispatchEvent(click_event);
    dom.querySelector("#anchor2").dispatchEvent(mouseover_event);
    chai.expect(spy).to.have.been.called.exactly(4);
  });

  it("shows the context menu", function() {
    var spy = chai.spy.on(menu, "behave");
    menu.show(dom.querySelector("#anchor1"));
    chai.expect(menu.is_hidden).to.equal(false);
    chai.expect(spy).to.have.been.called.with("show");
  });

  it("hides the context menu", function() {
    var spy = chai.spy.on(menu, "behave");
    menu.show(dom.querySelector("#anchor1"));
    menu.hide();
    chai.expect(menu.is_hidden).to.equal(true);
    chai.expect(spy).to.have.been.called.with("hide");
  });

  it("resets the timer for the context menu hide", function() {
    menu.hide_timer = setTimeout(() => console.log("this should never be printed"), 10000);
    menu.resetHideTimer();
    chai.expect(menu.hide_timer).to.be.null;

    menu.is_hidden = false;
    menu.hide_timer = setTimeout(() => console.log("this should never be printed"), 10000);
    chai.expect(menu.hide_timer).not.to.be.null;
    clearTimeout(menu.hide_timer);
  });

  it("hides context menu on an internal click", function() {
    menu.is_hidden = false;
    dom.dispatchEvent(click_event);
    chai.expect(menu.is_hidden).to.be.true;
  });

});
