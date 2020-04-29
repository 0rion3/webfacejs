import '../webface_init.js'
import { fetch_dom             } from '../test_utils.js'
import extend_as                 from '../lib/utils/mixin.js'
import NumericFormFieldComponent from '../lib/components/numeric_form_field_component.js'

describe("NumericFormFieldComponent", function() {

  var form_field, dom, simple_form_field_el, composite_form_field_el;

  beforeEach(async function() {
    dom = (await fetch_dom("fixtures/numeric_form_field_component.html")).querySelector("#simple_form_field")
    form_field = new NumericFormFieldComponent();
    form_field.dom_element = dom;
    form_field.afterInitialize();
  });

  it("doesn't allow to enter non-numeric characters", function() {
    form_field.set("value", "10");
    chai.expect(form_field.get("value")).to.eq(10);
    form_field.set("value", "10a");
    chai.expect(form_field.get("value")).to.eq(10);
  });

  it("doesn't allow value to be more than max_length", function() {
    form_field.set("max_length", 15);
    form_field.set("value", "12345678901234567");
    chai.expect(form_field.get("value")).to.be.null;
    form_field.set("value", "123456789012345");
    chai.expect(form_field.get("value")).to.eq(123456789012345);
  });

  it("doesn't allow the integer part to be larger then max_integer_length", function() {
    form_field.set("max_integer_length", 2);
    form_field.set("value", "12.3");
    chai.expect(form_field.get("value")).to.eq(12.3)
    form_field.set("value", "123.3");
    chai.expect(form_field.get("value")).to.eq(12.3);
  });

  it("doesn't allow the decimal part to be larger then max_decimal_length", function() {
    form_field.set("max_decimal_length", 2);
    form_field.set("value", "12.34");
    chai.expect(form_field.get("value")).to.eq(12.34)
    form_field.set("value", "12.345");
    chai.expect(form_field.get("value")).to.eq(12.34);
  });

  it("ingores incorrect non-numeric values and sets value to null instead", function() {
    form_field.set("value", ".");
    chai.expect(form_field.get("value")).to.be.null;
    form_field.set("value", ".0");
    chai.expect(form_field.get("value")).to.eq(0);
    form_field.set("value", "1.");
    chai.expect(form_field.get("value")).to.eq(1);
    form_field.set("value", "1.2345");
    chai.expect(form_field.get("value")).to.eq(1.2345);
    form_field.set("value", "1.5432");
    chai.expect(form_field.get("value")).to.eq(1.5432);
  });

  it("doesn't allow more than 1 decimal point", function() {
    form_field.set("value", "1");
    chai.expect(form_field.get("value")).to.eq(1);
    form_field.set("value", "1.1");
    chai.expect(form_field.get("value")).to.eq(1.1);
    form_field.set("value", "1.1.1");
    chai.expect(form_field.get("value")).to.eq(1.1);
    form_field.set("value", "1.12323.12313");
    chai.expect(form_field.get("value")).to.eq(1.1);
    form_field.set("value", ".1.1");
    chai.expect(form_field.get("value")).to.eq(1.1);
    form_field.set("value", "..");
    chai.expect(form_field.get("value")).to.eq(1.1);
  });

});
