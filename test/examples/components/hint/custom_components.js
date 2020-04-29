import extend_as from '../../../lib/utils/mixin.js'
import Component from '../../../lib/component.js'

export class ContainerComponent extends extend_as("ContainerComponent").mix(Component).with() {
}

export class ChildComponent extends extend_as("ChildComponent").mix(Component).with() {
  constructor() {
    super();
    this.native_events = [`${this.click_event.join(',')}`, "mouseover"];
  }
}
window.webface.component_classes["ContainerComponent"] = ContainerComponent;
window.webface.component_classes["ChildComponent"] = ChildComponent;
