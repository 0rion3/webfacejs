import '../webface_init.js'
import { extend_as       } from '../lib/utils/mixin.js'
import { fetch_dom       } from '../test_utils.js'
import { CheckboxComponent } from '../lib/components/checkbox_component.js'

describe("CheckboxComponent", function() {

  var checkbox, dom, spy;

  beforeEach(async function() {
    dom = (await fetch_dom("fixtures/checkbox_component.html")).querySelector("input");
    checkbox = new CheckboxComponent();
    checkbox.dom_element = dom;
    checkbox.afterInitialize();
  });

  it("reads #checked, #disabled and #name attributes from DOM after initialization", function() {
    chai.expect(checkbox.get("name")).to.equal("checkbox1");
    chai.expect(checkbox.get("disabled")).to.equal(false);
    chai.expect(checkbox.get("checked")).to.equal(false);
  });

  it("invokes check/uncheck behavior after #checked attr is changed", function() {
    spy = chai.spy.on(checkbox, "behave");
    checkbox.set("checked", true);
    checkbox.set("checked", false);
    chai.expect(spy).to.have.been.called.with("check")
    chai.expect(spy).to.have.been.called.with("uncheck")
  });

});
