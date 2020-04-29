import '../webface_init.js';
import { fetch_dom       }   from '../test_utils.js'
import extend_as             from '../lib/utils/mixin.js'
import RootComponent         from '../lib/components/root_component.js'
import DialogWindowComponent from '../lib/components/dialog_window_component.js'

describe("DialogWindowComponent", function() {

  var dw, dom, root, yes_button, no_button;

  beforeEach(async function() {
    dom = (await fetch_dom("fixtures/dialog_window_component.html"));
    var root_dom = dom.querySelector("#root");

    root = new RootComponent();
    root.dom_element = root_dom;
    root.initChildComponents();

    // ComponentDom#_initTemplate() uses this.constructor.owner_document, which
    // defaults to `document`. Since we're going to need to include this component's DOM into the
    // document anyway, makes sense to append root_dom as a child and avoid all the problems.
    document.querySelector("body").appendChild(root.dom_element);

    dw = new DialogWindowComponent("hello world", {
      "yes" : { "caption": "Yes", "type": "green", "value": "YES CLICKED" },
      "no" :  { "caption": "No",  "type": "blue",  "value": "NO CLICKED"  }
    });
    yes_button = dw.findFirstChildByRole("option_yes");
    no_button  = dw.findFirstChildByRole("option_no");

  });

  afterEach(function() {
    root.dom_element.remove();
  });

  it("creates an option button for each option", function() {
    chai.expect(yes_button).to.not.be.null;
    chai.expect(no_button).to.not.be.null;
  });

  it("button's dom_elements are added in to a special button container", function() {
    chai.expect(dw.findPart("button_container").children.length).to.eq(2);
    var children = Array.from(dw.findPart("button_container").children);
    children.forEach((b) => {
      chai.expect(b.getAttribute("data-component-class")).to.eq("ButtonComponent");
      chai.expect(["Yes", "No"]).to.include(b.innerText);
    });
  });

  it("creates an event handler for option button", function() {
    chai.expect(Object.keys(dw.event_handlers.map["click"])).to.include("option_yes");
    chai.expect(Object.keys(dw.event_handlers.map["click"])).to.include("option_no");
  });

  it("returns the resolved promise with the button's value", async function() {
    yes_button.dom_element.dispatchEvent(new MouseEvent("click"));
    await dw.promise.then((r) => {
      chai.expect(r).to.eq("YES CLICKED");
    });
  });

  it("closes the dialog window upon button click", async function() {
    yes_button.dom_element.dispatchEvent(new MouseEvent("click"));
    await dw.promise.then((r) => {
      chai.expect(dw.dom_element).to.be.null;
    });
  });

  it("adds appropriate 'type' passed in the option Map as a class to the Button", function() {
    chai.expect(Array.prototype.slice.call(yes_button.dom_element.classList)).to.include("green");
    chai.expect(Array.prototype.slice.call(no_button.dom_element.classList)).to.include("blue");
  });

});
