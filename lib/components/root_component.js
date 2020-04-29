import extend_as from '../utils/mixin.js'
import Component from '../component.js'
import I18n      from '../services/i18n.js'

export default class RootComponent extends extend_as("RootComponent").mix(Component).with() {

  static set instance(i) { this._instance = i   ; }
  static get instance()  { return this._instance; }

  constructor() {

    super();

    this.native_events = [`![${this.click_event.join(',')}]`];

    let self = this;
    this.event_handlers.add({ event: "click", role: "#self", handler: function(self, event) {
      self.applyToChildren('externalClickCallback', { args: [event], recursive: true, condition: function(child) {
        // Prevents calling the method if component contains the click target AND
        // the component doesn't have children, that is we're dealing with the lowest
        // component in the hierarchy.
        return !(child._hasNode(event.target));
      }});
    }});

    // This is to avoid the "initialized" event warning
    //this.event_handlers.add({ event: "initialized", handler: function() { console.log("initialized"); }});

    this._loadI18n();
    this.constructor.instance = this;

  }

  _loadI18n(doc=document) {
    if(window.webface.components_i18n == null) window.webface.components_i18n = {};
    window.webface.components_i18n["RootComponent"] = new I18n("i18n", doc);
  }

}
