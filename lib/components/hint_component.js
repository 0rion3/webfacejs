import extend_as              from '../utils/mixin.js'
import string_utils           from '../utils/string_utils.js'
import Component              from '../component.js'
import AutoShowHide           from '../modules/auto_show_hide.js'
import RootComponent          from '../components/root_component.js'
import HintComponentBehaviors from '../behaviors/hint_component_behaviors.js'
import Cookies                from '../utils/cookies.js'

/** The purpose of this component is rather simple - display popup hints over other elements on the page
  * whenever an event happens to this element: user clicks the element or hovers over it or something else.
  *
  * Attributes description:
  *
  *   * `anchor` - An anchor is an element in DOM or another component to which events the hint will be listening to.
  *   Normally, you'd want to specify value for the #anchor attr in a corresponding attribute to the hint's dom_element.
  *   See description for `#anchor_element` getter to learn more.
  *
  *   * `show_events`, `force_show_events` - These two attributes specify on which anchor events the hint appears.
  *   The `show_events` only works if the display_limit isn't reached or if the hint isn't
  *   permanently closed (never_show_again flag is set). The `force_show_events events` will force the hint to appear
  *   regardless of the limitations mentioned above.
  *
  *   * `autoshow_delay`, `autohide_delay` - These two attributes are rather self descriptive. Their value is time in seconds.
  *   By default, they're both null so hints are not show unless a specified event occurs on an anchor
  *   and they don't hide unless the user explicitly closes them by clicking on the close button.
  *
  *   * `display_limit` - You don't want to annoy your users by showing them hints every time they visit the page and, for example,
  *   happen to mouseover the anchor. In that case, you'll need set the display_limit attr to something sensible.
  *
  *   * `hint_id` - The number of times a hint was displayed is saved in a cookie, which needs to uniquely identify a particular HintComponent.
  *   For this reason it is important to have a #hint_id (data-hint-id) set to a unique value.
  *
  */
export default class HintComponent extends extend_as("HintComponent").mix(Component).with(AutoShowHide) {

  static get behaviors() { return [HintComponentBehaviors]; }

  constructor() {
    super();

    this.native_events   = [`close.[${this.click_event.join(',')}]`, `close_and_never_show.[${this.click_event.join(',')}]`];
    this.attribute_names = ["anchor", "show_events", "force_show_events", "autoshow_delay",
                            "autohide_delay", "display_limit", "hint_id"];

    this.anchor_events = [];
    this.visible       = false;

    this.default_attribute_values = {
      "display_limit": null,
      "show_events": this.click_event,
    };

  }

  afterInitialize() {
    super.afterInitialize();

    this.updateAttrsFromNodes();

    //-------------------------------------------------------------------------------/
    // This piece of code makes sure we only start adding event handlers once ALL
    // of the child components of the parent(!) component are loaded. A special
    // "initialized" event is published by parent, which we make use of here.

    // If we tried adding event handlers outside of "initialized" handler,
    // chances are, anchor_object might have been nil.
    //-------------------------------------------------------------------------------/

    this.afterParentInitialized(`${this.get("hint_id")}_parent`, (self, publisher) => {

      let show_events, force_show_events;
      if(self.get("show_events") && !string_utils.isBlank(self.get("show_events")))             show_events = self.get("show_events").split(",");
      if(self.get("force_show_events") && !string_utils.isBlank(self.get("force_show_events"))) force_show_events = self.get("force_show_events").split(",");

      if(self.anchor_object instanceof HTMLElement) {

        if(show_events)
          self._createNativeShowEvents(show_events, () => self.show());
        if(force_show_events)
          self._createNativeShowEvents(force_show_events, () => self.show({force: true}));

      } else if(self.anchor_object instanceof Component) {

        self.anchor_object.addObservingSubscriber(self);
        if(show_events)
          self._createChildComponentsShowEvents(show_events, (self,publisher) => self.show());
        if(force_show_events)
          self._createChildComponentsShowEvents(force_show_events, (self,publisher) => self.show({force: true}));

      }

      self.autoshow();

    });

    this.event_handlers.addForEvent(this.click_event, {
      "self.close":                (self,event) => self.hide(),
      "self.close_and_never_show": (self,event) => self.hide({ never_show_again: true })
    });

  }

  /** This method not only invokes the show() behavior,
    * but rather makes a check whether the display limit was reached,
    * updates said limit and sets autohide if applicable.
    */
  show({force=false}={}) {

    if(!this.isDisplayLimitReached || force) {
      this.hideOtherHints();
      var promise = this.behave("show").catch((rejection_msg) => {
        window.webface.logger.capture(rejection_msg, { log_level: "INFO" });
      });
      if(!force)
        this.incrementDisplayLimit();
      this.visible = true;
      this.autohide();
      return promise;
    }

  }

  /** Hides the hint and in case it's being closed with `close_and_never_show` part,
    * sets the appropriate cookie to indicate the hint shouldn't be displayed again.
    */
  hide({never_show_again=false}={}) {
    var promise = this.behave("hide");
    this.visible = false;
    if(never_show_again)
      Cookies.set(`hint_${this.get("hint_id")}_never_show_again`, "1");
    return promise;
  }

  /** It's important to not bloat user's screen with many hints. That's why we want to hide
    * all other hints when displaying the current one.
    */
  hideOtherHints() {
    this.root_component.findAllDescendantInstancesOf(this.constructor).forEach((d) => {
      if(this != d && d.visible)
        d.hide();
    });
  }

  /** Increments the display_limit counter and updates the corresponding cookie */
  incrementDisplayLimit() {
    var i = this.times_displayed + 1;
    if(!this.isDisplayLimitReached)
      Cookies.set(`hint_${this.get("hint_id")}`, i.toString(), 1780);
  }

  /** Checks whether the display_limit was reached.
    * Takes into account never_show_again flag (it's a cookie): if it's set, the answer is always true.
    */
  get isDisplayLimitReached() {
    return (Cookies.get(`hint_${this.get("hint_id")}_never_show_again`) == "1") || (this.get("display_limit") != null && this.get("display_limit") <= this.times_displayed);
  }

  /** Retrieves the cookie and shows how many times this hint was displayed.
    * Substitutes null for 0 in case the cookie is non-existent.
    */
  get times_displayed() {
    var i = Cookies.get(`hint_${this.get("hint_id")}`);
    if(i == null)
      return 0;
    else
      return parseInt(i);
  }

  /** An anchor is an element in DOM or another component to which events the hint will be listening to.
    * Normally, you'd want to specify value for the #anchor attr in a corresponding attribute to the hint's dom_element.
    * This getter takes the `#anchor` value, parses it and finds an object to be returned:
    * it will either be a `Component` or an `HtmlElement`.
    *
    * It is possible to specify anchors by their distinctive characteristics:
    *
    *   - By role: the prefix is `role:`. Example: `role:submit`.
    *   - By attr name: the prefix is `attr:`. Example: `attr:caption`
    *   - By part name: the prefix is `part:`. Example: `part:input_value`
    *   - By DOM element id: then the prefix is ommited Example: `submit_form_button`
    *   - When specifying a role, you can also specify this role component's part: `role:button:caption`
    */
  get anchor_object() {

    var anchor_name_arr = this.get("anchor").split(":");
    switch(anchor_name_arr[0]) {
      case "part":
        this._anchor_object = this.parent.findPart(anchor_name_arr[1]);
        break;
      case "attr":
        this._anchor_object = this.parent.findFirstAttrElement(anchor_name_arr[1]);
        break;
      case "role":
        if(anchor_name_arr.length == 2)
          this._anchor_object = this.parent.findFirstChildByRole(anchor_name_arr[1]);
        else if(anchor_name_arr.length == 3)
          this._anchor_object = this.parent.findFirstChildByRole(anchor_name_arr[1]).findPart(anchor_name_arr[2]);
        break;
      default:
        this._anchor_object = this.parent.firstDomDescendantOrSelfWithAttr(this.parent.dom_element, { attr_name: "id", attr_value: anchor_name_arr[0] });
    }

    return this._anchor_object;
  }

  /** In cases when anchor_object returns an instance of `Component`, this
    * getter makes sure it returns the `#dom_element` of that component.
    * Otherwise it returns the same `HtmlElement` returned by `#anchor_object`.
    */
  get anchor_el() {
    if(this.anchor_object instanceof Component)
      return this.anchor_object.dom_element;
    else
      return this.anchor_object;
  }

  _createNativeShowEvents(events, handler) {
    events.forEach((event_name) => {
      this.anchor_events.push(this.anchor_object.addEventListener(event_name, handler));
    });
  }

  _createChildComponentsShowEvents(events, handler) {
    events.forEach((event_name) => {
      this.event_handlers.add({ event: event_name, role: this.get("anchor").split(":")[1], handler: handler });
    }, this);
  }


}
window.webface.component_classes["HintComponent"] = HintComponent;
