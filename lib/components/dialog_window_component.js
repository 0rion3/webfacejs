import { extend_as       } from '../utils/mixin.js'
import { merge_maps, object_to_map } from '../utils/map_utils.js'
import { ModalWindowComponent } from '../components/modal_window_component.js'
import { ButtonComponent }      from '../components/button_component.js'

/** This component is almost like ModalWindowComponent with one major difference:
  * the `#completed` attr returns a Future which may later be used
  * to run code upon the the DialogWindow closure.
  *
  * Additionally, it automatically adds buttons which all close the window,
  * but return different values from the Future. That way, you can determine
  * which button was pressed and run the aprropriate code.
  *
  * Example.
  * A dialog window that asks to confirm the removal of a user's blog post would
  * have two buttons: "Yes" and "No". Clicking the first one, makes
  * the DialogWindow Future complete with `true`, while clicking the second
  * one makes it complete with `false`.
  *
  * Which buttons return what is determined by the `#options` attr -
  * read documentation on it to understand how to have the buttons you want to.
  * You can pass a value for this attr as a second argument to the constructor.
  *
  * The options that were passed as a second argument to the ModalWindowComponent's
  * constructor are no longer available and are set to sane defaults - a dialog window
  * is a little less flexible in terms of how you can close it!
  */
export class DialogWindowComponent extends extend_as("DialogWindowComponent").mix(ModalWindowComponent).with() {

  constructor(content, opts=null) {

    // Remember, this calls ModalWindowComponent's constructor, which in turns show()
    // which in turn calls afterInitialize(); Seem comments on show() call in ModalWindowComponent's constructor.
    super(content, {});

    /** This defines Button roles and captions and the values the window's Future
      * returns when one of the buttons is pressed.
      *
      * The keys in the Map are button roles, the inside of the nested map
      * is sort of self-descriptive. Perhaps "type" should be explained:
      * it basically adds the right kind of html class to the button.
      */
    if(opts != null)
      this.options = opts;
    else
      this.options = { "ok" : { "caption": "OK", "type" : null, "value": true }};

    var self = this;
    this._button_promise = new Promise((resolve,reject) => {

      Object.keys(self.options).forEach((k) => {

        var v = self.options[k];
        var button = new ButtonComponent();

        button.set("caption", v["caption"]);
        button.roles = [`option_${k}`];
        button.set("lockable", false);
        self.addChild(button);
        if(v["type"] != null)
          button.dom_element.classList.add(v["type"]);

        // Create click event handlers for each option button
        self.event_handlers.add({ event: self.click_event, role: `option_${k}`, handler: (self,event) => {
          self.hide();
          resolve(v["value"]);
        }});

      });

    });
    this._promise = Promise.race([this._promise, this._button_promise]);

    // Some sane settings for the Dialog window that are not supposed to be changed:
    // (at least for now) - user shouldn't be able to close it in any other way,
    // than by clicking the presented option buttons.
    this.close_on_escape           = true;
    this.close_on_background_click = true;
    this.show_close_button         = true;

  }

  _appendChildDomElement(el) {
    if(el.getAttribute("data-component-class") == "ButtonComponent")
      this.findPart("button_container").append(el);
    else
      this.dom_element.append(el);
  }

}
window.webface.component_classes["DialogWindowComponent"] = DialogWindowComponent;
