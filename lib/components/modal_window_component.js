import extend_as                     from '../utils/mixin.js'
import Component                     from '../component.js'
import RootComponent                 from '../components/root_component.js'
import ModalWindowComponentBehaviors from '../behaviors/modal_window_component_behaviors.js'
import PublicPromise                 from '../utils/public_promise.js'

export default class ModalWindowComponent extends extend_as("ModalWindowComponent").mix(Component).with() {

  static get behaviors() { return [ModalWindowComponentBehaviors]; }

  /** This the text that's going to appear inside the content element.
    * Only set it if you want to display a simple message,
    * as it will basically remove every child of the #content element and set the HtmlElement's #text attr.
    */
  get text()  { return this._text; }
  set text(t) { this.content_el.innerHTML = t; this._text = t; }
  get content_el() { return this.findPart("content"); }

  /** Creates and displays the new modal window. The argument passed
    * may either be an HtmlElement - in which case it will appear inside the modal window,
    * or a simple string of text, which will appear inside the default #content element.
    */
  constructor(content, attrs={}) {

    super();

    this.native_events   = [`close.[${this.click_event.join(',')}]`, `background.[${this.click_event.join(',')}]`];
    this.attribute_names = ["close_on_escape", "close_on_background_click", "show_close_button"];
    this.default_attribute_values = {
      "close_on_escape"           : true,
      "close_on_background_click" : true,
      "show_close_button"         : true
    };

    /** Contains the content for the #content_el. It's actually only used once,
      * in the constructor while setting #content_el, so changing it accomplishes nothing.
      * You can however use the `text` setter.
      */
    this.content = content;

    /** This is the Future containing the value returned by the window
      * when it closes. Depends on which button was clicked. */

    // TODO: setting attrs through constructor should be a Component
    // responsibility.
    for(let k in attrs)
      this.attributes[k] = attrs[k];

    // Interesting thing about this call:
    //  1. RootComponent#addChild() gets called
    //  2. which in turn calls ModalWindowComponent#afterInitialize()
    //  3. Only after that, the execution returns to show() and behave("show") is called.
    this.show();

  }

  afterInitialize() {

    super.afterInitialize();

    var self = this;
    this.promise = new PublicPromise();

    if(this.get("show_close_button"))
      this.event_handlers.add({ event: this.click_event, role: "self.close", handler: (self,event) => {
        self.hide(false);
      }});
    else
      this.behave("hideCloseButton");

    if(this.get("close_on_background_click")) {
      this.event_handlers.add({ event: this.click_event, role: "self.background", handler: (self,event) => {
        self.hide(false);
      }});
    }

    // Workaround. Browsers don't catch keydown events on divs, only on document -
    // but, surprise, it corretly sets the target, so we can still get it!
    if(this.get("close_on_escape"))
      document.addEventListener("keydown", (e) => { self._processKeyDownEvent(e); });

    if(typeof this.content === "string")
      this.text = this.content;
    else if(this.content instanceof HTMLElement)
      this.content_el.append(this.content);
    else if(this.content instanceof Component) {
      this.addChild(this.content);
      if(this.content.display_state_manager)
        this.content.display_state_manager.applyChanges();
    }

  }

  /** Adds itself to RootComponent as a child, appends dom_element to it, calls show() behaviors*/
  show() {
    var r = RootComponent.instance;
    r.addChild(this);
    if(r.dom_element.children.length != 1) {
      r.dom_element.children[r.dom_element.children.length-1].remove();
      r.dom_element.insertBefore(this.dom_element, r.dom_element.children[0]);
    }
    this.behave("show");
  }

  /** Removes itself to RootComponent's children list, removes itself
    * RootComponent#dom_element's children, calls hide() behavior.
    * The method returns a promise and resolves it with the value passed to this method.
    * Why? Because it awaits for the hide animation to complete. It will not resolve
    * the promise until animation has completed.
    * */
  close(promise_result=true) {
    if(this.close_animation_promise == null) {
      this.close_animation_promise = this.behave("hide");
      var self = this;
      this.close_animation_promise.then((r) => {
        if(r && this.hidden == null) self.remove({ ignore_null_dom_element: true });
        self.promise.resolve(promise_result);
      });
    }
    return this.promise;
  }
  // Alias to close();
  hide(promise_result=true) { return this.close(promise_result); }

  _processKeyDownEvent(e) {
    // This check is necessary to avoid `TypeError: Cannot read attr 'remove' of null`
    // when user presses ESC twice.
    if(this.hidden)
      return;

    if(e.keyCode == 27) {
      // Let's also remove the listener first to avoid handling the ESC press again.
      document.removeEventListener("keydown", () => {});
      // Then hide the window.
      this.hide(false);
    }
    this.hidden = true;
  }

  _appendChildDomElement(el) {
    this.content_el.appendChild(el);
  }

}
window.webface.component_classes["ModalWindowComponent"] = ModalWindowComponent;
