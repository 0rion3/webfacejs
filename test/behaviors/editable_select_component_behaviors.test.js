import '../webface_init.js'
import { fetch_dom     } from '../test_utils.js'
import { EditableSelectComponentBehaviors } from '../lib/behaviors/editable_select_component_behaviors.js'

describe("EditableSelectComponentBehaviors", function() {

  var dom, behaviors, input;

  beforeEach(async function() {
    dom = (await fetch_dom("fixtures/editable_select_component.html")).querySelector('#editable_selectbox');
    var component = {
      dom_element: dom,
      findPart:     (name) => dom.querySelector(`[data-component-part="${name}"]`),
      findAllParts: (name) => dom.querySelectorAll(`[data-component-part="${name}"]`),
    }
    behaviors = new EditableSelectComponentBehaviors(component);
    input = behaviors.input;
  });

  it("disables the selectbox and removes the placholder", function() {
    behaviors.disable();
    chai.expect(input.getAttribute("disabled")).to.eq("disabled");
    chai.expect(input.getAttribute("placeholder")).to.be.empty;
  });

  it("disables the selectbox and removes the placholder", function() {
    behaviors.disable();
    behaviors.enable();
    chai.expect(input.getAttribute("disabled")).to.be.null;
    chai.expect(input.getAttribute("placeholder")).to.eq("Start typing...");
  });

});
