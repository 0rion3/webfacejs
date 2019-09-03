import '../webface_init.js'
import { extend_as       } from '../lib/utils/mixin.js'
import { fetch_dom       } from '../test_utils.js'
import { FormFieldComponent } from '../lib/components/form_field_component.js'

class MyFormFieldComponent extends FormFieldComponent {
  constructor() {
    super();
    this.validations = { 'value': { 'isNumeric' : true }};
  }
}

describe("FormFieldComponent", function() {

  var form_field, dom, simple_form_field_el, composite_form_field_el;

  beforeEach(async function() {
    dom = (await fetch_dom("fixtures/form_field_component.html"))
    composite_form_field_el = dom.querySelector("#composite_form_field");
    form_field = new MyFormFieldComponent();
    form_field.dom_element = composite_form_field_el;
    form_field.afterInitialize();
  });

  it("catches change event from the dom_element when dom_element is the value_holder", function() {
    simple_form_field_el = dom.querySelector("#simple_form_field");
    form_field = new MyFormFieldComponent();
    form_field.dom_element = simple_form_field_el;
    form_field.afterInitialize();

    form_field.dom_element.value = "some text";
    form_field.dom_element.dispatchEvent(new Event("change"));
    chai.expect(form_field.get("value")).to.equal("some text");
  });

  it("catches change event from the value_holder_element when form_field is composite", function() {
    form_field.value_holder_element.value = "some text";
    form_field.value_holder_element.dispatchEvent(new Event("change"));
    chai.expect(form_field.get("value")).to.equal("some text");
  });

  it("sets value to the value_holder_element after the attribute has been changed", function() {
    form_field.set("value", "hello world");
    chai.expect(form_field.value_holder_element.value).to.equal("hello world");
  });

  it("loads existing value from DOM upon initialization", function() {
    chai.expect(form_field.get("value")).to.equal("initial value");
  });

  it("resets an element value", function() {
    form_field.value_holder_element.value = "some text";
    form_field.value_holder_element.dispatchEvent(new Event("change"));
    form_field.reset();
    chai.expect(form_field.get("value")).to.equal("initial value");
    chai.expect(form_field.value_holder_element.value).to.equal("initial value");
  });

  it("show and hide validation_errors_summary block accordingly", function() {
    form_field.validate();
    chai.expect(form_field.dom_element.querySelector("#errors").style.display).to.equal("block");
    form_field.set("value", 1);
    form_field.validate();
    chai.expect(form_field.dom_element.querySelector("#errors").style.display).to.equal("none");
  });

  describe("disabling", function() {

    it("adds disabled='disabled' attribute to the dom element", function() {
      form_field.set("disabled", true);
      chai.expect(form_field.value_holder_element.getAttribute("disabled")).to.eq("disabled");
    });

    it("removes disabled attribute from the dom element completely when disabled set to false", function() {
      form_field.set("disabled", true);
      form_field.set("disabled", false);
      chai.expect(form_field.value_holder_element.attributes["disabled"]).to.be.undefined;
    });

  });


});
