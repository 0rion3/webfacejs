import extend_as                   from '../../../lib/utils/mixin.js'
import Component                   from '../../../lib/component.js'
import SimpleNotificationComponent from '../../../lib/components/simple_notification_component.js'

export class ContainerComponent extends extend_as("ContainerComponent").mix(Component).with() {
  constructor() {
    super();

    this.event_handlers.add({ event: "click", role: "regular_notification", handler: (self, child) => {
      SimpleNotificationComponent.createFromTemplate({ attrs: { message: "Regular notification"}});
    }});

    this.event_handlers.add({ event: "click", role: "warning_notification", handler: (self, child) => {
      SimpleNotificationComponent.createFromTemplate({ attrs: { message: "Warning notification", message_type: "warning" }});
    }});

    this.event_handlers.add({ event: "click", role: "permanent_notification", handler: (self, child) => {
      SimpleNotificationComponent.createFromTemplate({ attrs: { message: "Permanent notification", message_type: "warning", permanent: true }});
    }});

    this.event_handlers.add({ event: "click", role: "duplicatable_permanent_notification", handler: (self, child) => {
      SimpleNotificationComponent.createFromTemplate({ attrs: { message: "Duplicatable permanent notification", message_type: "warning", permanent: true, ignore_duplicates: false }});
    }});

  }
}

window.webface.component_classes["ContainerComponent"] = ContainerComponent;
