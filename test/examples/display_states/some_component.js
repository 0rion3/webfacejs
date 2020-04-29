import extend_as from '../../lib/utils/mixin.js'
import Component from '../../lib/component.js'

export class SomeComponent extends extend_as("SomeComponent").mix(Component).with() {
  constructor() {
    super();
    this.attribute_names = ["status", "time_of_day", "time_of_year"];

    this.event_handlers.addForEvent("click", {
      status_to_new:          (self,event) => self.set("status", "new"),
      status_to_returning:    (self,event) => self.set("status", "returning"),
      time_of_day_to_morning: (self,event) => self.set("time_of_day", "morning"),
      time_of_day_to_night:   (self,event) => self.set("time_of_day", "night"),
      time_of_year_to_spring: (self,event) => self.set("time_of_year", "spring"),
      time_of_year_to_summer: (self,event) => self.set("time_of_year", "summer")
    });

    this.display_states = [
      [{ time_of_year: "spring",                 }, ".discount"],
      [{ time_of_day:  "not_null()"              }, ".time_of_day_greeting"],
      [{ status: "returning"                     }, ".welcome"],
      [{ status: "new", time_of_day: "is_null()" }, ".welcome_new_user"],
      [{ status: "new", time_of_day: "morning"   }, ".good_morning"],
      [{ status: "new", time_of_day: "night"     }, ".good_night"]
    ];

  }

  set(attr_name, value) {
    super.set(attr_name, value);
    console.log(this.attributes);
  }

}
window.webface.component_classes["SomeComponent"] = SomeComponent;
