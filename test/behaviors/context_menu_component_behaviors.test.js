import '../webface_init.js'
import { extend_as     } from '../lib/utils/mixin.js'
import { fetch_dom     } from '../test_utils.js'
import { ContextMenuComponentBehaviors } from '../lib/behaviors/context_menu_component_behaviors.js'

describe("ContextMenuComponentBehaviors", function() {

  var behaviors, menu, anchor, dom;

  beforeEach(async function() {

    dom          = (await fetch_dom("fixtures/context_menu_component.html")).querySelector("#root");
    anchor       = dom.querySelector("#anchor1");
    menu         = {
      "dom_element" : dom.querySelector("#context_menu"),
      "constructor" : { "owner_document": { "body": dom }},
      "findPart"    : function(name) { dom.querySelector(`[data-component-part="${name}"]`) }
    };
    behaviors    = new ContextMenuComponentBehaviors(menu);

    // Otherwise animations won't work!
    document.querySelector("body").appendChild(dom);

  });

  afterEach(function() {
    dom.remove();
    menu.dom_element.remove();
  });

  it("shows menu by the specified anchor", async function() {
    await behaviors.show(anchor);
    chai.expect(menu.dom_element.style.display).to.equal("block");
  });

  it("hides the menu", async function() {
    await behaviors.show(anchor);
    await behaviors.hide();
    chai.expect(menu.dom_element.style.display).to.equal("none");
  });

});
