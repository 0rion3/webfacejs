import '../webface_init.js'
import { extend_as       } from '../lib/utils/mixin.js'
import { fetch_dom       } from '../test_utils.js'
import { RootComponent }   from '../lib/components/root_component.js'
import { EditableSelectComponent } from '../lib/components/editable_select_component.js'

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

  it("re-creates event listeners for options when they're loaded or filtered", function() {
    select.findPart("display_input").value = "ABC option";
    select.filterOptions();
    select.opened = true;
    select.findAllParts("option")[0].click();
    chai.expect(select.get("input_value")).to.eq("abc");
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

    it("sets input_value to null on external click when display_value is empty", function() {
      select.set("input_value", "ab");
      display_input.value = "";

      root.dom_element.click();
      chai.expect(select.get("display_value")).to.be.undefined;
      chai.expect(select.get("input_value")).to.eq(null);
      chai.expect(select.findPart("input").value).to.eq("");
      chai.expect(select.findPart("display_input").value).to.eq("");
    });

  });

});
