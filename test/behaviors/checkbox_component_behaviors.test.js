import '../webface_init.js'
import { extend_as     } from '../lib/utils/mixin.js'
import { fetch_dom     } from '../test_utils.js'
import { CheckboxComponentBehaviors } from '../lib/behaviors/checkbox_component_behaviors.js'

describe("CheckboxComponentBehaviors", function() {

  var behaviors;

  beforeEach(async function() {
    var component = { "dom_element" : await fetch_dom("fixtures/checkbox_component.html") };
    behaviors = new CheckboxComponentBehaviors(component);
  });

  it("sets checked=true on #check behavior", function() {
    behaviors.check();
    chai.expect(behaviors.dom_element.getAttribute("checked")).to.eq("true")
  });

  it("sets checked=false on #uncheck behavior", function() {
    behaviors.check();
    behaviors.uncheck();
    chai.expect(behaviors.dom_element.getAttribute("checked")).to.be.null;
    
  });

});
