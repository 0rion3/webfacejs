import '../webface_init.js'
import { fetch_dom                                   } from '../test_utils.js'
import { RadioButtonComponent, NoOptionWithSuchValue } from '../lib/components/radio_button_component.js'
import extend_as                                       from '../lib/utils/mixin.js'

describe("RadioButtonComponent", function() {

  var radio, dom;

  beforeEach(async function() {
    dom = (await fetch_dom("fixtures/radio_button_component.html")).querySelector("#radio");
    radio = new RadioButtonComponent();
    radio.dom_element = dom;
    radio.afterInitialize();
  });

  it("sets value from DOM", function() {
    radio.findAllParts("option")[2].checked = true;
    radio.findAllParts("option")[2].dispatchEvent(new Event("change"));
    chai.expect(radio.get("value")).to.eq("value3");
    radio.findAllParts("option")[2].checked = false;
    radio.findAllParts("option")[0].checked = true;
    radio.findAllParts("option")[2].dispatchEvent(new Event("change"));
    radio.findAllParts("option")[0].dispatchEvent(new Event("change"));
    chai.expect(radio.get("value")).to.eq("value1");
  });

  it("loads all options and their DOM elements from DOM into the #options List", function() {
    chai.expect(Object.keys(radio.options)).to.eql(["value1", "value2", "value3"]);
  });

  it("selects option based on the current value", function() {
    radio.set("value", "value1");
    chai.expect(radio.findAllParts("option")[0].checked).to.be.true;
    chai.expect(radio.findAllParts("option")[1].checked).to.be.false;
    chai.expect(radio.findAllParts("option")[2].checked).to.be.false;
    radio.set("value", "value2");
    chai.expect(radio.findAllParts("option")[0].checked).to.be.false;
    chai.expect(radio.findAllParts("option")[1].checked).to.be.true;
    chai.expect(radio.findAllParts("option")[2].checked).to.be.false;
    radio.set("value", "value3");
    chai.expect(radio.findAllParts("option")[0].checked).to.be.false;
    chai.expect(radio.findAllParts("option")[1].checked).to.be.false;
    chai.expect(radio.findAllParts("option")[2].checked).to.be.true;
  });

  it("raises a NoOptionWithSuchValue error if none of the options have the value that's being set", function() {
    chai.expect(function() { radio.set("value", "some other value") }).to.throw(NoOptionWithSuchValue);
  });

  it("sets value from the selected DOM option", function() {
    radio.findAllParts("option")[1].checked = true;
    radio.setValueFromSelectedOption();
    chai.expect(radio.get("value")).to.eq("value2");
  });


});
