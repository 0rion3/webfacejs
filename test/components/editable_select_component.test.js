import '../webface_init.js'
import { fetch_dom           } from '../test_utils.js'
import extend_as               from '../lib/utils/mixin.js'
import RootComponent           from '../lib/components/root_component.js'
import EditableSelectComponent from '../lib/components/editable_select_component.js'

describe("EditableSelectComponent", function() {

  var dom, select, root;

  beforeEach(async function() {
    dom  = (await fetch_dom("fixtures/editable_select_component.html"))
    root = new RootComponent();
    root.dom_element = dom.querySelector("#root");
    root.initChildComponents();
    select = root.findChildrenByRole("selectbox")[0];
  });

  it("filters existing options", function() {
    select.findPart("display_input").value = "ab";
    select.filterOptions();
    chai.expect(select.options.keys).to.deep.equal(["ab", "abc", "abcd", "abcde"]);
    select.findPart("display_input").value = "abcd";
    select.filterOptions();
    chai.expect(select.options.keys).to.deep.equal(["abcd", "abcde"]);
    select.findPart("display_input").value = "abcdef";
    select.filterOptions();
    chai.expect(select.options.keys).to.be.empty;
  });

  it("sets value to null when disabled and restores previous value when enabled", function() {
    select.set("allow_custom_value", true);
    var display_input = select.findPart("display_input");
    var input         = select.findPart("input");
    display_input.value = "custom value";
    var e = new KeyboardEvent('keyup', { keyCode: 13 });
    select.findPart("display_input").dispatchEvent(e);
    select.set("disabled", true);
    chai.expect(select.get("input_value")).to.be.null;
    chai.expect(select.get("display_value")).to.be.null;
    chai.expect(input.value).to.be.empty;
    chai.expect(display_input.value).to.be.empty;
    select.set("disabled", false);
    chai.expect(select.get("input_value")).to.eq("custom value");
    chai.expect(select.get("display_value")).to.eq("custom value");
    chai.expect(input.value).to.eq("custom value");
    chai.expect(display_input.value).to.eq("custom value");
  });

  describe("filtering options", function() {

    it("re-creates event listeners for options when they're loaded or filtered", function() {
      select.findPart("display_input").value = "ABC option";
      select.filterOptions();
      select.opened = true;
      select.findAllParts("option")[0].click();
      chai.expect(select.get("input_value")).to.eq("abc");
    });

    it("filters options as text is being typed", function() {
      select.findPart("display_input").value = "ABC option";
      select.filterOptions();
      chai.expect(select.options.keys).to.include("abc", "abcd", "abcde");
      chai.expect(select.options.keys).to.not.include("a", "ab");
    });

    it("resets options filter when arrow is clicked", function() {
      select.findPart("display_input").value = "ABC option";
      select.filterOptions();
      select.findPart("arrow").click();
      chai.expect(select.options.keys).to.include("a", "ab", "abc", "abcd", "abcde");

    });

    it("re-creates option click event listeners when resetting filters", function() {
      select.resetOptionsFilter();
      select.dom_element.querySelector('[data-option-value="abcd"').click();
      chai.expect(select.get("input_value")).to.equal("abcd");
    });

  });

  describe("setting value from the existing options list", function() {

    it("sets previous value for display_value and doesn't change input_value when ESC is pressed", function() {
      select.set("input_value", "a");
      select.findPart("display_input").value = "ab";
      var e = new KeyboardEvent('keyup', { keyCode: 27 });
      select.findPart("display_input").dispatchEvent(e);
      chai.expect(select.get("input_value")).to.eq("a");
      chai.expect(select.get("display_value")).to.eq("A option");
      chai.expect(select.findPart("input").getAttribute("value")).to.eq("a");
      chai.expect(select.findPart("display_input").getAttribute("value")).to.eq("A option");
    });

    it("sets new value for actual input when ENTER or TAB is pressed on", function() {
      select.findPart("display_input").value = "AB option";
      var e = new KeyboardEvent('keyup', { keyCode: 13 });
      select.findPart("display_input").dispatchEvent(e);
      chai.expect(select.get("input_value")).to.eq("ab");
      chai.expect(select.get("display_value")).to.eq("AB option");
      chai.expect(select.findPart("input").value).to.eq("ab");
      chai.expect(select.findPart("display_input").value).to.eq("AB option");

      select.findPart("display_input").value = "ABC option";
      e = new KeyboardEvent('keyup', { keyCode: 9 });
      select.findPart("display_input").dispatchEvent(e);
      chai.expect(select.get("input_value")).to.eq("abc");
      chai.expect(select.get("display_value")).to.eq("ABC option");
      chai.expect(select.findPart("input").value).to.eq("abc");
      chai.expect(select.findPart("display_input").value).to.eq("ABC option");
    });

  });

  describe("setting custom value", function() {

    var display_input;

    beforeEach(function() {
      select.set("allow_custom_value", true);
      display_input = select.findPart("display_input");
    });

    it("sets input_value to display_value when ENTER is pressed", function() {
      display_input.value = "custom value";
      var e = new KeyboardEvent('keyup', { keyCode: 13 });
      display_input.dispatchEvent(e);
      chai.expect(select.get("input_value")).to.eq("custom value");
    });

    it("sets input_value to display_value when TAB is pressed", function() {
      display_input.value = "custom value";
      var e = new KeyboardEvent('keyup', { keyCode: 9 });
      display_input.dispatchEvent(e);
      chai.expect(select.get("input_value")).to.eq("custom value");
    });

    it("sets input_value to display_value when external click is detected", function() {
      display_input.value = "custom value";
      root.dom_element.click();
      chai.expect(select.get("input_value")).to.eq("custom value");
    });

    it("doesn't set custom value if allow_custom_value is false", function() {
      select.set("allow_custom_value", false);
      display_input.value = "custom value";
      var e = new KeyboardEvent('keyup', { keyCode: 13 });
      display_input.dispatchEvent(e);
      chai.expect(select.get("input_value")).not.to.eq("custom value");
    });

    it("doesn't change input_value on external click if display_value changed and set_custom_value_on_extrnal_click is false", function() {
      select.set("set_custom_value_on_external_click", false);
      select.set("input_value", "ab");
      const new_value = select.get("display_value") + "1";
      select.set("display_value", new_value);

      root.dom_element.click();
      chai.expect(select.get("input_value")).to.eq("ab");
      chai.expect(select.findPart("input").value).to.eq("ab");
      chai.expect(select.get("display_value")).to.eq(new_value);
      chai.expect(select.findPart("display_input").value).to.eq(new_value);
    });

    it("doesn't change value on external click when event trigger has data-ignore-external-click-for value that matches ignore_external_click_id attr", function() {
      select.set("input_value", "ab");
      root.dom_element.querySelector("button#reset_payment_method_select").click();
      chai.expect(select.get("input_value")).to.eq("ab");
    });

    it("only publishes the change event if value actually chaged", function() {
      select.set("input_value", "ab");

      var publish_event_spy = chai.spy.on(select, "publishEvent");
      display_input.value = "custom value1";
      select.setValueFromManualInput();
      select.setValueFromManualInput();

      // Should have been called only once, since the second time
      // value doesn't change
      chai.expect(publish_event_spy).to.have.been.called.once;
    });

  });

});
