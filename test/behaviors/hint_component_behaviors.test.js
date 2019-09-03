import '../webface_init.js'
import { extend_as     } from '../lib/utils/mixin.js'
import { fetch_dom     } from '../test_utils.js'
import { HintComponentBehaviors } from '../lib/behaviors/hint_component_behaviors.js'

describe("HintComponentBehaviors", function() {

  var behaviors, hint, dom_anchor, dom_hint, dom;

  beforeEach(async function() {

    dom          = (await fetch_dom("fixtures/hint_component.html")).querySelector("#root");
    dom_hint     = dom.querySelector("#hint_1");
    dom_anchor   = dom.querySelector("#hint_1_anchor");
    hint         = { "dom_element" : dom_hint, "anchor_el": dom_anchor, "constructor" : { "owner_document": { "body": dom }}};
    behaviors    = new HintComponentBehaviors(hint);
    behaviors.show_hide_animation_speed = 1;
    behaviors.pos.base_offset = { "x" : 0, "y" : 0 };

    // Otherwise animations won't work!
    document.querySelector("body").appendChild(dom);

  });

  afterEach(function() {
    dom.remove();
    dom_hint.remove();
  });

  it("positions itself above the anchor, on the right side when enough space above and to the right", function() {
    dom_anchor.style.top  = "30px";
    dom_anchor.style.left = "10px";
    behaviors.show();
    chai.expect(hint.dom_element.style.top).to.eq("19px");
    chai.expect(hint.dom_element.style.left).to.eq("20px");
    chai.expect(Array.from(hint.dom_element.classList)).to.include("arrowBottomLeft");
  });

  it("positions itself above the anchor, on the left side when enough space above, but NOT enough on the right", function() {
    dom_anchor.style.top  = "30px";
    dom_anchor.style.left = "990px";
    behaviors.show();
    chai.expect(hint.dom_element.style.top).to.eq("19px");
    chai.expect(hint.dom_element.style.left).to.eq("968px");
    chai.expect(Array.from(hint.dom_element.classList)).to.include("arrowBottomRight");
  });
  
  it("positions itself below the anchor, on the right side when NOT enough space above, but enough on the right", function() {
    dom_anchor.style.top  = "0px";
    dom_anchor.style.left = "10px";
    behaviors.show();
    chai.expect(hint.dom_element.style.top).to.eq("10px");
    chai.expect(hint.dom_element.style.left).to.eq("20px");
    chai.expect(Array.from(hint.dom_element.classList)).to.include("arrowTopLeft");
  });

  it("positions itself below the anchor, on the left side when NOT enough space above and NOT enough on the right", function() {
    dom_anchor.style.top  = "0px";
    dom_anchor.style.left = "990px";
    behaviors.show();
    chai.expect(hint.dom_element.style.top).to.eq("10px");
    chai.expect(hint.dom_element.style.left).to.eq("968px");
    chai.expect(Array.from(hint.dom_element.classList)).to.include("arrowTopRight");
  });

});
