import '../webface_init.js'
import { extend_as       } from '../lib/utils/mixin.js'
import { fetch_dom       } from '../test_utils.js'
import { Cookies         } from '../lib/utils/cookies.js'
import { RootComponent   } from '../lib/components/root_component.js'
import { SimpleNotificationComponent } from '../lib/components/simple_notification_component.js'

describe("SimpleNotificationComponent", function() {

  var dom, root, notifications;

  beforeEach(async function() {

    dom  = (await fetch_dom("fixtures/simple_notification_component.html")).querySelector("#root");
    SimpleNotificationComponent.owner_document = dom;
    root = new RootComponent();
    root.dom_element = dom;
    root.initChildComponents();
    notifications = root.findAllDescendantInstancesOf(SimpleNotificationComponent);

  });

  afterEach(function() {
    dom.remove();
  });

  it("shows automatically upon initialization", function() {
    chai.expect(notifications[0].visible).to.be.true;
  });

  it("hides itself automatically after a autodisplay_delay seconds pass", async function() {
    chai.expect(notifications[0].visible).to.be.true;
    await notifications[0].autohide_promise;
    chai.expect(notifications[0].visible).to.be.false;
  });

  it("hides itself when close button is clicked", function() {
    notifications[1].findPart("close").dispatchEvent(new MouseEvent("click"));
    chai.expect(notifications[1].visible).to.be.false;
  });

  it("closes and never shows the notification again", function() {
    notifications[1].set("message_id", "it");
    notifications[1].set("never_show_again", true);
    notifications[1].findPart("close").dispatchEvent(new MouseEvent("click"));
    chai.expect(notifications[1].visible).to.be.false;
    notifications[1].show();
    chai.expect(notifications[1].visible).to.be.false;
    Cookies.delete("message_it_never_show_again");
  });

  it("doesn't allow to hide itself if it's permanent", async function() {
    notifications[1].set("message_id", "permanent_notification_1");
    notifications[1].set("permanent", true);
    await notifications[1].hide();
    chai.expect(window.webface.logger.last_error.message).to.include("Cannot hide SimpleNotification with id permanent_notification_1 because it's permanent");
    chai.expect(notifications[1].visible).to.be.true;
  });

  it("removes itself from it's parent children's collection on hide", function() {
    chai.expect(notifications[1].parent.children).to.include(notifications[1]);
    notifications[1].hide();
    chai.expect(notifications[1].parent.children).not.to.include(notifications[1]);
  });

  it("doesn't show two notifications with identical messages", async function() {
    var sn1 = SimpleNotificationComponent.createFromTemplate({ attrs: { message: "hello world", message_id: "hw1" }});
    var sn2 = SimpleNotificationComponent.createFromTemplate({ attrs: { message: "hello world", message_id: "hw2" }});
    await sn1.show_promise;
    await sn2.show_promise;
    var visible_notifications = RootComponent.instance.findChildrenByRole("simple_notifications_container")[0].children;
    chai.expect(visible_notifications).to.include(sn1);
    chai.expect(visible_notifications).not.to.include(sn2);
  });

});
