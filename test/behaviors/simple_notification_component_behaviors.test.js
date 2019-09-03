import '../webface_init.js'
import { extend_as     } from '../lib/utils/mixin.js'
import { fetch_dom     } from '../test_utils.js'
import { SimpleNotificationComponentBehaviors } from '../lib/behaviors/simple_notification_component_behaviors.js'

describe("SimpleNotificationComponentBehaviors", function() {

  var dom, sn, behaviors;

  beforeEach(async function() {
    dom = (await fetch_dom("fixtures/simple_notification_component.html")).querySelector("#root");
    sn  = dom.querySelector('[data-component-class="SimpleNotificationComponent"]');
    behaviors    = new SimpleNotificationComponentBehaviors({
      "dom_element" : sn,
      "findPart": function(p) {
        return sn.querySelector(`[data-component-part="${p}"]`);
      },
      "get": function(attr_name) {
          if(attr_name == "message_type") return "neutral";
      }
    });
    behaviors.show_hide_animation_speed = 1;
    behaviors.pos.base_offset = { "x" : 0, "y" : 0 };
    behaviors.component.get = function(attr) {
      if(attr == "show_behavior")      return "show";
      else if(attr == "hide_behavior") return "hide";
    }

    // Otherwise animations won't work!
    document.querySelector("body").appendChild(dom);
  });

  afterEach(function() {
    dom.remove();
  });

  it("displays the notification", async function() {
    chai.expect(sn.style.display).to.equal("none");
    await behaviors.show();
    chai.expect(sn.style.display).to.equal("block");
  });

  it("hides, then removes the dom_element from the DOM", async function() {
    behaviors.show();
    await behaviors.hide();
    chai.expect(sn.style.display).to.equal("none");
    chai.expect(dom.querySelector(".simpleNotificationTemplate")).to.be.null;
  });

  it("hides the close button if it exists", function() {
    chai.expect(sn.querySelector(".closeNotification")).not.to.be.null;
    behaviors.hideCloseButton();
    chai.expect(sn.querySelector(".closeNotification")).to.be.null;
  });

});
