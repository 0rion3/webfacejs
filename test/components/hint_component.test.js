import '../webface_init.js'
import { fetch_dom } from '../test_utils.js'
import extend_as     from '../lib/utils/mixin.js'
import RootComponent from '../lib/components/root_component.js'
import HintComponent from '../lib/components/hint_component.js'
import Cookies       from '../lib/utils/cookies.js'

describe("HintComponent", function() {

  var dom, root, hints, anchor_els;

  beforeEach(async function() {

    [...Array(6).keys()].forEach((i) => {
      Cookies.delete(`hint_hint${i}`);
      Cookies.delete(`hint_hint${i}_never_show_again`);
    });

    dom  = (await fetch_dom("fixtures/hint_component.html")).querySelector("#root");
    root = new RootComponent();
    root.dom_element = dom;
    root.initChildComponents();
    hints      = root.findChildrenByRole("hint");
    anchor_els = root.dom_element.querySelectorAll(".anchor");

    // Otherwise animations won't work!
    document.querySelector("body").appendChild(dom);

  });

  afterEach(function() {
    dom.remove();
  });

  describe("finding anchor", function() {

    it("finds anchor element in his parent's list of parts", function() {
      // here we use the default value for anchor, which was set in beforeEach();
      chai.expect(hints[0].get("anchor")).to.eq("part:hint_1_anchor");
      chai.expect(hints[0].anchor_object).to.eq(dom.querySelector("#hint_1_anchor"));
    });

    it("finds anchor element in his parent's list of attributes", function() {
      chai.expect(hints[1].get("anchor")).to.eq("attr:hint_2_anchor");
      chai.expect(hints[1].anchor_object).to.eq(dom.querySelector("#hint_2_anchor"));
    });

    it("finds anchor element in his parents DOM el descendants using HTML id attribute", function() {
      chai.expect(hints[2].get("anchor")).to.eq("hint_3_anchor");
      chai.expect(hints[2].anchor_object).to.eq(dom.querySelector("#hint_3_anchor"));
    });

    it("finds anchor element in his parent's children", function() {
      chai.expect(hints[3].get("anchor")).to.eq("role:hint_4_anchor");
      chai.expect(hints[3].anchor_object.dom_element).to.eq(dom.querySelector("#hint_4_anchor"));
    });

    it("finds anchor element in his parent's child parts", function() {
      chai.expect(hints[4].get("anchor")).to.eq("role:hint_4_anchor:hint_5_anchor");
      chai.expect(hints[4].anchor_object).to.eq(dom.querySelector("#hint_5_anchor"));
    });
    
  });

  describe("creating events", function() {

    it("creates an event handler triggering show for a native event on an anchor when it's an HTML element", function() {
      anchor_els[0].dispatchEvent(new MouseEvent("mouseover"));
      chai.expect(hints[0].visible).to.be.true;
      hints[0].visible = false;
      anchor_els[0].dispatchEvent(new MouseEvent("mouseover"));
      chai.expect(hints[0].visible).to.be.false;
    });

    it("creates an event handler triggering forced show for a native event on an anchor when it's an HTML element", function() {
      anchor_els[0].dispatchEvent(new MouseEvent("mouseover"));
      chai.expect(hints[0].visible).to.be.true;
      hints[0].visible = false;
      anchor_els[0].dispatchEvent(new MouseEvent("click"));
      chai.expect(hints[0].visible).to.be.true;
    });

    describe("for Components as hint anchors", function() {

      it("creates an event handler triggering show for a component event on an anchor when it's a Component", function() {
        hints[3].anchor_object.publishEvent("change1");
        chai.expect(hints[3].visible).to.be.true;
        hints[3].visible = false;
        hints[3].anchor_object.publishEvent("change1");
        chai.expect(hints[3].visible).to.be.false;
      });

      it("creates an event handler triggering forced show for a component event on an anchor when it's a Component", function() {
        hints[3].anchor_object.publishEvent("change1");
        chai.expect(hints[3].visible).to.be.true;
        hints[3].visible = false;
        hints[3].anchor_object.publishEvent("change2");
        chai.expect(hints[3].visible).to.be.true;
      });

    });

  });

  it("updates cookie with a display limit incrementing it by 1", function() {
    hints[0].set("display_limit", 2)
    hints[0].incrementDisplayLimit();
    chai.expect(Cookies.get("hint_hint1")).to.eq("1");
    hints[0].incrementDisplayLimit();
    chai.expect(Cookies.get("hint_hint1")).to.eq("2");
    hints[0].incrementDisplayLimit();
    chai.expect(Cookies.get("hint_hint1")).to.eq("2");
  });

  it("checks wether display limit is reached", function() {
    hints[0].set("display_limit", 2)
    hints[0].incrementDisplayLimit();
    chai.expect(hints[0].isDisplayLimitReached).to.be.false;
    hints[0].set("display_limit", 3)
    hints[0].incrementDisplayLimit();
    chai.expect(hints[0].isDisplayLimitReached).to.be.false;
    hints[0].incrementDisplayLimit();
    chai.expect(hints[0].isDisplayLimitReached).to.be.true;
  });

  it("calls the show behavior after a show event is invoked", function() {
    var spy = chai.spy.on(hints[0], "behave");
    anchor_els[0].dispatchEvent(new MouseEvent("click"));
    chai.expect(spy).to.have.been.called.with("show");
  });

  it("calls the hide behavior and sets visible to false", function() {
    var spy = chai.spy.on(hints[0], "behave");
    hints[0].hide();
    chai.expect(spy).to.have.been.called.with("hide");
  });

  it("hides all other hints for this parent when showing a new one", function() {
    hints[1].show();
    chai.expect(hints[0].visible).to.be.false;
    chai.expect(hints[1].visible).to.be.true;
    hints[0].show();
    chai.expect(hints[0].visible).to.be.true;
    chai.expect(hints[1].visible).to.be.false;
  });

  describe("auto show/hide", function() {

    it("shows itself automatically after initialization", async function() {
      await hints[4].autoshow_promise;
      chai.expect(hints[4].visible).to.be.true;
    });

    it("hides itself automatically after a autodisplay_delay seconds pass", async function() {
      await hints[4].autohide_promise;
      chai.expect(hints[4].visible).to.be.false;
    });
    
  });

  describe("closing", function() {

    it("closes the hint", function() {
      anchor_els[0].dispatchEvent(new MouseEvent("mouseover"));
      hints[0].findPart("close").dispatchEvent(new MouseEvent("click"));
      chai.expect(hints[0].visible).to.be.false;
    });

    it("closes and never shows the hint again", function() {
      anchor_els[0].dispatchEvent(new MouseEvent("mouseover"));
      chai.expect(hints[0].visible).to.be.true;
      hints[0].findPart("close_and_never_show").dispatchEvent(new MouseEvent("click"));
      Cookies.delete(`hint_hint1`);
      chai.expect(hints[0].visible).to.be.false;
      anchor_els[0].dispatchEvent(new MouseEvent("mouseover"));
      chai.expect(hints[0].visible).to.be.false;
    });
  
  });

});
