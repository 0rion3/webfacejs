import { extend_as } from '../utils/mixin.js'
import { Component } from '../component.js'
import { ContextMenuComponentBehaviors } from '../behaviors/context_menu_component_behaviors.js'

export class ContextMenuComponent extends extend_as("ContextMenuComponent").mix(Component).with() {

  static get behaviors() { return [ContextMenuComponentBehaviors]; }

  constructor() {
    super();

    this.native_events            = ["mouseover"];
    this.attribute_names          = ["anchor_events", "hide_timeout", "anchors"];
    this.behaviors                = [ContextMenuComponentBehaviors];
    this.is_hidden                = true;
    this.default_attribute_values = { anchor_events: "click", hide_timeout: 3000 };

    this.event_handlers.add({ event: "mouseover", role: "#self", handler: (self,publisher) => self.resetHideTimer() });
    this.event_handlers.add({ event: this.click_event, role: "self.top", handler: (self,publisher) => {
      if(this.is_hidden) show();
      else               hide();
    }});
  }

  afterInitialize() {
    super.afterInitialize();
    this.updateAttrsFromNodes({ attrs: ["anchor_events", "anchors", "hide_timeout"], invoke_callbacks: false });
    this._listenToAnchorEvents()
  }

  resetHideTimer() {
    if(this.hide_timer != null) {
      clearTimeout(this.hide_timer);
      this.hide_timer = null;
    }
    var self = this;
    if(this.is_hidden == false) {
      this.hide_timer = setTimeout(() => self.hide(), self.get("hide_timeout"));
    }
  }

  hide() {
    if(!this.is_hidden) {
      this.is_hidden = true;
      this.behave("hide");
      this.resetHideTimer();
    }
  }

  show(anchor) {
    if(this.is_hidden) {
      this.is_hidden = false;
      this.behave("show", [anchor]);
    }
  }

  externalClickCallback() {
    this.hide();
  }

  _listenToAnchorEvents() {
    var self = this;
    if(this.get("anchors") == null) return;
    this.get("anchors").split(",").forEach((anchor_name) => {
      let anchor_el = this.root_component.dom_element.querySelector(`[data-context-menu-anchor="${anchor_name}"]`);
      this.get("anchor_events").split(",").forEach((e) => {
        anchor_el.addEventListener(e, () => self.show(anchor_el));
      });
    });
  }

}
window.webface.component_classes["ContextMenuComponent"] = ContextMenuComponent;
