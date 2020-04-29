import '../webface_init.js'
import { fetch_dom              } from '../test_utils.js'
import extend_as                  from '../lib/utils/mixin.js'
import RootComponent              from '../lib/components/root_component.js'
import DialogWindowComponent      from '../lib/components/dialog_window_component.js'
import ConfirmableButtonComponent from '../lib/components/confirmable_button_component.js'

describe("ConfirmableButtonComponent", function() {

  var button, dom, root;
  var click_event = new MouseEvent("click", { bubbles: true });

  beforeEach(async function() {
    dom = (await fetch_dom("fixtures/confirmable_button_component.html")).querySelector("#root");
    root = new RootComponent();
    root.dom_element = dom;
    root.initChildComponents();
    button = root.findChildrenByRole("confirmable_button")[0];

    // ComponentDom#_initTemplate() uses this.constructor.owner_document, which
    // defaults to `document`. Since we're going to need to include this component's DOM into the
    // document anyway, makes sense to append root_dom as a child and avoid all the problems.
    document.querySelector("body").appendChild(dom);
  });

  afterEach(function() {
    dom.remove();
  });

  it("presents user with a confirmation dialog window when clicked", function() {
    button.dom_element.dispatchEvent(click_event);
    chai.expect(root.findAllDescendantInstancesOf(DialogWindowComponent).length).to.eq(1);
  });

  it("sets the DialogWindowComponent content to the value of the confirmation attribute", function() {
    button.dom_element.dispatchEvent(click_event);
    chai.expect(root.findAllDescendantInstancesOf(DialogWindowComponent)[0].text).to.eq("Are you sure?");
  });

  it("publishes click_and_deny event if NO was pressed in the dialog window", async function() {
    var spy = chai.spy.on(button, "publishEvent");
    button.dom_element.dispatchEvent(click_event);
    var result;
    var dialog_window = root.findAllDescendantInstancesOf(DialogWindowComponent)[0];
    dialog_window.promise.then((r) => result = r);
    dialog_window.children[1].dom_element.dispatchEvent(click_event);
    await dialog_window.promise;
    chai.expect(result).to.be.false;
    chai.expect(spy).to.have.been.called.with("click_and_deny");
  });

  it("does something if YES is pressed in the dialog window", async function() {
    var spy = chai.spy.on(button, "publishEvent");
    button.dom_element.dispatchEvent(click_event);
    var result;
    var dialog_window = root.findAllDescendantInstancesOf(DialogWindowComponent)[0];
    dialog_window.promise.then((r) => result = r);
    dialog_window.children[0].dom_element.dispatchEvent(click_event);
    await dialog_window.promise;
    chai.expect(result).to.be.true;
    chai.expect(spy).to.have.been.called.with("click_and_confirm");
  });

  it("submits the form if confirmable_button is a form submit button", async function() {
    var result;
    var form = dom.querySelector("form");
    form.addEventListener("submit", function(e) {
        e.preventDefault();
        result = true;
    }, true);
    var form_button = root.findChildrenByRole("confirmable_button")[1];
    form_button.dom_element.dispatchEvent(click_event);
    var dialog_window = root.findAllDescendantInstancesOf(DialogWindowComponent)[0];
    dialog_window.children[0].dom_element.dispatchEvent(click_event);
    await dialog_window.promise;
    chai.expect(result).to.be.true;
  });

});
