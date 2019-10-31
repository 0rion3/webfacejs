import '../webface_init.js'
import { extend_as       } from '../lib/utils/mixin.js'
import { fetch_dom       } from '../test_utils.js'
import { RootComponent } from '../lib/components/root_component.js'
import { SelectComponent } from '../lib/components/select_component.js'

describe("SelectComponent", function() {

  var dom, select, root;

  beforeEach(async function() {
    dom  = (await fetch_dom("fixtures/select_component.html"))
    root = new RootComponent();
    root.dom_element = dom.querySelector("#root");
    root.initChildComponents();
    select = root.findChildrenByRole("selectbox")[0];
  });

  it("reads options from dom", function() {
    // No need to call readOptionsFromDom(), it's done automatically in afterInitialize()
    chai.expect(select.options.keys).to.eql(["null", "Bank wire", "Cash", "Cryptocurrency"]);
    chai.expect(select.options.values).to.eql(["-- Choose payment method --", "Bank wire", "Cash", "Cryptocurrency"]);
  });

  it("gets next value for an option based on the current one", function() {
    chai.expect(select.getNextValue("Cash")).to.eq("Cryptocurrency");
    chai.expect(select.getNextValue("Cryptocurrency")).to.be.undefined;
  });

  it("gets previous value for an option based on the current one", function() {
    chai.expect(select.getPrevValue("Cash")).to.eq("Bank wire");
    chai.expect(select.getPrevValue("null")).to.be.undefined;
  });

  it("focuses on the next and previous options", function() {
    select.setValueByInputValue("Cash");
    select.focusPrevOption();
    chai.expect(select.focused_option).to.equal("Bank wire");
    select.focusNextOption();
    chai.expect(select.focused_option).to.equal("Cash");
  });

  it("sets value from keypress stack", function() {
    var spy = chai.spy.on(select, "behave");
    select.keypress_stack = "ca";
    select.setValueFromKeypressStack();
    chai.expect(select.get("input_value")).to.equal("Cash");
    chai.expect(spy).to.be.called.with("focusCurrentOption");
  });

  it("updates keypress stack with a new char", function() {
    select.keypress_stack_last_updated = 0;
    select.updateKeypressStackWithChar("a", 2000);
    chai.expect(select.keypress_stack).to.equal("a");
    select.updateKeypressStackWithChar("b", 2500);
    chai.expect(select.keypress_stack).to.equal("ab");
    select.updateKeypressStackWithChar("c", 5000);
    chai.expect(select.keypress_stack).to.equal("c");
  });

  it("sets focus on a selected element and toggles open/close behavior", function() {
    select.opened = true;
    select.focused_option = "Cash";
    select.setFocusedAndToggle();
    chai.expect(select.get("input_value")).to.equal("Cash");
    chai.expect(select.opened).to.be.false;
    select.setFocusedAndToggle();
    chai.expect(select.opened).to.be.true;
  });

  it("gets an id of the focused option", function() {
    select.setValueByInputValue("Cash");
    chai.expect(select.focused_option_id).to.equal(2);
    select.setValueByInputValue("null");
    chai.expect(select.focused_option_id).to.be.null;
  });

  it("gets key name for a specific value in options", function() {
    chai.expect(select.optionKeyForValue("Cash")).to.equal("Cash");
    chai.expect(select.optionKeyForValue(null)).to.be.undefined
    chai.expect(select.optionKeyForValue("non existent")).to.be.undefined;
  });

  it("toggles open/close states", function() {
    var spy = chai.spy.on(select, "behave");
    select.toggle();
    chai.expect(select.opened).to.be.true;
    select.toggle();
    chai.expect(select.opened).to.be.false;
    chai.expect(spy).to.have.been.called.with("open");
    chai.expect(spy).to.have.been.called.with("close");
  });

  it("resets to the initial value", function() {
    select.set("input_value", "Cash");
    select.reset();
    chai.expect(select.get("input_value")).to.equal("Bank wire");
  });

  it("clears the value by setting it to null", function() {
    select.clear();
    chai.expect(select.get("input_value")).to.equal(null);
  });

  describe("disabling", function() {

    it("adds disabled='disabled' attribute to the dom element", function() {
      select.set("disabled", true);
      chai.expect(select.dom_element.getAttribute("disabled")).to.eq("disabled");
    });

    it("removes disabled attribute from the dom element completely when disabled set to false", function() {
      select.set("disabled", true);
      select.set("disabled", false);
      chai.expect(select.dom_element.attributes["disabled"]).to.be.undefined;
    });

  });

  describe("fetching remote options with ajax request", function() {

    beforeEach(function() {
      select.set("sort_on_fetch", true);
    });

    it("updates fetch url params", function() {
      select.set("fetch_url", "localhost:3000")
      select.updateFetchUrlParams({ country: "Chile", region: "Santiago" });
      chai.expect(select.get("fetch_url")).to.equal("localhost:3000?country=Chile&region=Santiago");
      select.set("fetch_url", "/locations");
      select.updateFetchUrlParams({ hello: "world" });
      chai.expect(select.get("fetch_url")).to.eq("/locations?hello=world");
      select.updateFetchUrlParams({ hello: "hi" });
      chai.expect(select.get("fetch_url")).to.eq("/locations?hello=hi");
      select.updateFetchUrlParams({ param2: "value2" });
      chai.expect(select.get("fetch_url")).to.eq("/locations?hello=hi&param2=value2");
      select.updateFetchUrlParams({ hello: "world" });
      chai.expect(select.get("fetch_url")).to.eq("/locations?hello=world&param2=value2");
      select.updateFetchUrlParams({ hello: null });
      chai.expect(select.get("fetch_url")).eq("/locations?param2=value2");
    });

    it("sets options from fetched json", function() {
      select._setOptionsFromJson({ "option1": "value1"});
      chai.expect(select.options.get("option1")).to.eq("value1");
      select._setOptionsFromJson([["option2", "value2"]]);
      chai.expect(select.options.get("option2")).to.eq("value2");
      select._setOptionsFromJson([["option3", { "display_value" : "value3", "some_data1": "data1" }]]);
      chai.expect(select.options.get("option3")).to.eq("value3");
      chai.expect(select.options_data.option3.some_data1).to.eq("data1");
      select._setOptionsFromJson({ "option4": { "display_value": "value4", "some_data2": "data2"}});
      chai.expect(select.options.get("option4")).to.eq("value4");
      chai.expect(select.options_data.option4.some_data2).to.eq("data2");

      select._setOptionsFromJson('not a valid json');
      chai.expect(window.webface.logger.last_error.message).to.include("Warning: cannot parse the fetched json");
    });

    it("sorts the fetched json options by value (if sort_on_fetch option is set)", function() {
      select._setOptionsFromJson({ "key1": "b", "key2": "c", "key3": "a" });
      chai.expect(select.options.values).to.eql(["a", "b", "c"]);
      select._setOptionsFromJson({ "null": "zzz", "key1": "b", "key2": "c", "key3": "a" });
      chai.expect(select.options.values).to.eql(["zzz", "a", "b", "c"]);
    });

    it("fetches options via an ajax request", async function() {
      await select.fetchOptions();
      chai.expect(select.options.keys).to.eql(["key3", "key1", "key2"]);
      chai.expect(select.options.values).to.eql(["a - fetched key 3", "b - fetched key 1", "c - fetched key 2"]);
    });

  });

  describe("setting value using the input value", function() {

    it("accepts a null value and assigns null to input_value and an empty string to display_value", function() {
      select.set("input_value", "Cash")
      select.setValueByInputValue("null");
      chai.expect(select.get("input_value")).to.be.null;
      chai.expect(select.get("display_value")).to.eq("-- Choose payment method --");
    });

    it("accepts a non-null value and assigns it to both input_value and display_value", function() {
      select.setValueByInputValue("Cash");
      chai.expect(select.get("input_value")).to.eq("Cash");
      chai.expect(select.get("display_value")).to.eq("Cash");
    });

    it("sets the focus option", function() {
      select.setValueByInputValue("Cash");
      chai.expect(select.focused_option).to.equal("Cash");
    });

    it("publishes a change event", function() {
      var spy = chai.spy.on(select, "publishEvent");
      select.setValueByInputValue("Cash");
      chai.expect(spy).to.have.been.called.once.with("change");
    });

    it("doesn't publish a change event if input_value hasn't changed", function() {
      select.attributes["input_value"] = "Cash";
      var spy = chai.spy.on(select, "publishEvent");
      select.setValueByInputValue("Cash");
      chai.expect(spy).to.not.have.been.called.with("change");
    });

    it("sets value to the previous or next one based on which value is current", function() {
      select.setValueByInputValue("Cash");
      select.setPrevValue();
      chai.expect(select.get("input_value")).to.equal("Bank wire");
      select.setNextValue();
      chai.expect(select.get("input_value")).to.equal("Cash");
      select.setNextValue();
      chai.expect(select.get("input_value")).to.equal("Cryptocurrency");
      select.setNextValue(); // Current value is the last one. An attempt to select the next one is simply ignored and current value is retained.
      chai.expect(select.get("input_value")).to.equal("Cryptocurrency");
    });

    it("sets display_value from current input_value", function() {
      select.attributes.input_value = "Cash";
      select.setDisplayValueFromCurrentInputValue();
      chai.expect(select.get("display_value")).to.equal("Cash");
    });

    it("automatically updates display_value when input_value changes", function() {
      select.set("input_value", "Cash");
      chai.expect(select.get("display_value")).to.equal("Cash");
    });

  });

  describe("processing keydown events", function() {

    it("closes selectbox when ESC is pressed", function() {
      select.opened = true;
      var e = new KeyboardEvent('keydown', { keyCode: 27 });
      select.dom_element.dispatchEvent(e);
      select._processKeyDownEvent(e);
      chai.expect(select.opened).to.be.false;
    });

    it("focuses on previous option or sets previous value when Arrow UP is pressed", function() {
      var focusPrevOption_spy = chai.spy.on(select, "focusPrevOption");
      var setPrevValue_spy    = chai.spy.on(select, "setPrevValue");

      select.opened = false;
      var e = new KeyboardEvent('keydown', { keyCode: 38 });
      select.dom_element.dispatchEvent(e);
      select._processKeyDownEvent(e);
      chai.expect(setPrevValue_spy).to.have.been.called.once;

      select.opened = true;
      select._processKeyDownEvent(e);
      chai.expect(focusPrevOption_spy).to.have.been.called.once;
    });

    it("focuses on next option or sets previous value when Arrow DOWN is pressed", function() {
      var focusNextOption_spy = chai.spy.on(select, "focusNextOption");
      var setNextValue_spy    = chai.spy.on(select, "setNextValue");

      select.opened = false;
      var e = new KeyboardEvent('keydown', { keyCode: 40 });
      select.dom_element.dispatchEvent(e);
      select._processKeyDownEvent(e);
      chai.expect(setNextValue_spy).to.have.been.called.once;

      select.opened = true;
      select._processKeyDownEvent(e);
      chai.expect(focusNextOption_spy).to.have.been.called.once;
    });

    it("sets focus and toggles when ENTER or SPACE is pressed", function() {
      var setFocusedAndToggle_spy = chai.spy.on(select, "setFocusedAndToggle");
      var e1 = new KeyboardEvent('keydown', { keyCode: 13 });
      var e2 = new KeyboardEvent('keydown', { keyCode: 32 });
      select.dom_element.dispatchEvent(e1);
      select.dom_element.dispatchEvent(e2);
      select._processKeyDownEvent(e1);
      select._processKeyDownEvent(e2);
      chai.expect(setFocusedAndToggle_spy).to.have.been.called.twice;
    });

  });


});
