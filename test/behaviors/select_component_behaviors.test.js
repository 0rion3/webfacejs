import '../webface_init.js'
import { fetch_dom     } from '../test_utils.js'
import { LinkedHashMap } from '../lib/utils/linked_hash_map.js'
import { SelectComponentBehaviors } from '../lib/behaviors/select_component_behaviors.js'

describe("SelectComponentBehaviors", function() {

  var dom, behaviors;

  beforeEach(async function() {
    dom = (await fetch_dom("fixtures/select_component.html")).querySelector('#selectbox');
    var attrs = {  hide_null_option_after_option_selected: false, input_value: "1" }
    var component = {
      lines_to_show: 3,
      dom_element: dom,
      focused_option: null,
      findPart:     (name) => dom.querySelector(`[data-component-part="${name}"]`),
      findAllParts: (name) => dom.querySelectorAll(`[data-component-part="${name}"]`),
      event_locks: { add: function() {}, remove: function() {} },
      get: (k) => {
        if(attrs[k] != null) return attrs[k];
        else return "do nothing";
      },
      set: (k,v) => "do_nothing",
      addEventLock: () => "do_nothing"
    }
    behaviors = new SelectComponentBehaviors(component);

    // Otherwise we can't tell the height
    document.querySelector("body").appendChild(dom);
  });

  afterEach(function() {
    dom.remove();
    chai.spy.restore();
  });

  it("calculates the height of the opened selectbox based on how many lines it's set to show", function() {
    behaviors.options_container.style.display = "block";
    behaviors._applyLinesToShow();
    // 5 option elements, but 3 lines to show * 10px
    chai.expect(behaviors.options_container.style.height).to.eq("30px");

    behaviors.component.lines_to_show = 7
    behaviors._applyLinesToShow();
    // 5 lines to show, but 4 option elements * 10px
    chai.expect(behaviors.options_container.style.height).to.eq("40px");
  });

  it("opens the select box", function() {
    var spies = [chai.spy.on(behaviors, "_applyLinesToShow"), chai.spy.on(behaviors, "focusCurrentOption")];
    behaviors.open();
    chai.expect(behaviors.scroll_pos_bottom).to.equal(2);
    chai.expect(Array.from(behaviors.selectbox.classList)).to.include("open");
    chai.expect(behaviors.options_container.style.minWidth).to.eq("198px"); // 200 - 2;
    chai.expect(behaviors.options_container.style.display).to.eq("block");
    chai.expect(behaviors.component.focused_option).to.eq("1");
    spies.forEach((s) => chai.expect(s).to.have.been.called.once);
  });

  it("closes the select box", function() {
    var spy = chai.spy.on(behaviors, "_removeFocusFromOptions");
    behaviors.open();
    behaviors.close();
    chai.expect(Array.from(behaviors.selectbox.classList)).not.to.include("open");
    chai.expect(behaviors.options_container.style.display).to.eq("none");
    chai.expect(spy).to.have.been.called.twice; // twice because it's called on opening and on closing too
  });

  it("toggles open/close for a select box", function() {
    var spies = [chai.spy.on(behaviors, "open"), chai.spy.on(behaviors, "close")];
    behaviors.toggle();
    behaviors.component.opened = true; // Because SelectComponent is responsible for setting this flag.
    behaviors.toggle();
    spies.forEach((s) => chai.expect(s).to.have.been.called.once);
  });

  it("focuses on the currently selected option when the option list is visible", function() {
    var spies = [chai.spy.on(behaviors, "_removeFocusFromOptions"), chai.spy.on(behaviors, "_scroll")];
    behaviors.component.focused_option = "Bank wire";
    behaviors.focusCurrentOption();
    spies.forEach((s) => chai.expect(s).to.have.been.called.once);
    chai.expect(
      Array.from(dom.querySelector(".optionsContainer").querySelector('[data-option-value="Bank wire"]').classList)
    ).to.include("focused");
  });

  it("removes focus from any option which currently has a focus", function() {
    behaviors.component.focused_option = "Bank wire";
    behaviors.focusCurrentOption();
    behaviors._removeFocusFromOptions();
    chai.expect(
      Array.from(dom.querySelector(".optionsContainer").querySelector('[data-option-value="Bank wire"]').classList)
    ).not.to.include("focused");
  });

  it("hides no-value option", function() {
    behaviors.hideNoValueOption();
    chai.expect(dom.querySelector('[data-option-value="null"]')).to.be.null;
  });

  it("shows no-value option after it was hidden", function() {
    behaviors.hideNoValueOption();
    behaviors.showNoValueOption();
    chai.expect(dom.querySelector('[data-option-value="null"]')).to.not.be.null;
    chai.expect(behaviors.options_container.querySelector('[data-component-part="option"]')[0]).to.eq(this.null_option_el);
  });

  it("adds a separation line", function() {
    behaviors.component.separators_below = ["Bank wire"];
    behaviors.addSeparationLine();
    chai.expect(Array.from(behaviors.options_container.querySelector('[data-option-value="Bank wire"]').classList)).to.include("optionSeparator");
  });

  it("sets top values", function() {
    behaviors.component.top_values = "Cryptocurrency,Cash";
    var spies = [chai.spy.on(behaviors, "updateOptionsInDom"), chai.spy.on(behaviors.component, "_listenToOptionClickEvents")];
    behaviors.setTopValues();
    spies.forEach((s) => chai.expect(s).to.have.been.called.once);
    var options = [];
    behaviors.component.options.forEach((k,v) => {
      options.push([k,v]);
    });
    chai.expect(options).to.eql([
      ["Cryptocurrency", "Cryptocurrency"],
      ["Cash", "Cash"],
      ["null", "-- Choose payment method --"],
      ["Bank wire", "Bank wire"]
    ]);
  });

  it("updates DOM to be consistent with the content of component.options", function() {
    var options = new LinkedHashMap();
    options.addTail("key1", 1);
    options.addTail("key2", 2);
    options.addTail("key3", 3);
    behaviors.component.options = options;
    behaviors.updateOptionsInDom();
    var option_els = behaviors.options_container.children;

    var i = 1;
    Array.from(option_els).forEach((el) => {
      chai.expect(el.innerText).to.equal(i.toString());
      chai.expect(el.getAttribute("data-option-value")).to.eq("key" + i);
      i++;
    });

  });

  it("scrolls to the focused option", function() {
    behaviors.open();

    behaviors.component.focused_option_id = 4;
    behaviors._scroll();
    // 11px here Because scroll top != the bottom of the block.
    // We have 4 items in our options list, each 10px. 3 are visible,
    // therefore scrolling back just 10px down would reveal the bottom item.
    chai.expect(behaviors.options_container.scrollTop).to.equal(10);

    behaviors.component.focused_option_id = 1;
    behaviors._scroll();
    chai.expect(behaviors.options_container.scrollTop).to.equal(0);
  });

});
