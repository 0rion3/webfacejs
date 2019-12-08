import { extend_as } from '../../../lib/utils/mixin.js'
import { Component } from '../../../lib/component.js'
import { CountdownTimer, StopwatchTimer } from '../../../lib/utils/timer.js';

export class TimerComponent extends extend_as("TimerComponent").mix(Component).with() {

  constructor() {
    super();

    this.attribute_names          = ["name", "direction", "duration", "milestones", "step_time", "time_unit", "timer_display", "status"];
    this.default_attribute_values = { direction: "up", duration: "60", milestones: "", step_time: 1, time_unit: "second" };

    this.event_handlers.addForEvent("click", {
      start: (self, child)  => {
        self.timer = new self.timer_class(self.timer_params);
        self.timer.start();
      },
      pause: (self, child)  => self._runIfTimerExists(() => self.timer.pause()),
      resume: (self, child) => self._runIfTimerExists(() => self.timer.resume()),
      finish: (self, child) => self._runIfTimerExists(() => self.timer.finish()),
      current_time: (self, child) => self._runIfTimerExists(() => console.log(`Timer "${this.get("name")}" current time is ${JSON.stringify(self.timer.humanTime())}`))
    });

  }

  afterInitialize() {
    super.afterInitialize();
    this.updateAttrsFromNodes();
    this.set("status", "none");

    if(this.get("direction") == "up")
      this.timer_class = StopwatchTimer;
    else
      this.timer_class = CountdownTimer;

    var self = this;
    var callbacks = {
      default: (t,event) => {
        var event = event.slice(-1) == "e" ? event + "d" : event + "ed";
        console.log(`Timer "${self.get("name")}" ${event}.`);
        this.set("status", `started: ${self.timer.started}, paused: ${t.paused_at != null}, finished: ${t.finished}`);
      },
      step: (t) => {
        let ht = t.humanTime();
        let ms = t.time_unit_multiplier == 1 ? `:${ht.ms}` : "";
        let w  = ht.weeks   ? `${ht.weeks}w, ` : "";
        let d  = ht.days    ? `${ht.days}d, `  : "";
        let h  = ht.hours   ? `${ht.hours}:`    : "00:";
        let m  = ht.minutes ? `${ht.minutes}:`  : "00:";
        let formatted_time_string = `${w}${d}${h}${m}${ht.seconds}${ms}`;
        this.set("timer_display", formatted_time_string);
      }
    }

    if(this.get("milestones")) {
      callbacks.time_points = this.get("milestones").split(",").map((m) => {
        return [parseInt(m), () => console.log(`Milestone (${m}, time unit: ${this.get("time_unit")}) for Timer ${this.get("name")} was reached.`)]
      }, this);
    }

    this.timer_params = {
      duration: this.get("duration"),
      step_time: this.get("step_time"),
      time_unit: this.get("time_unit"),
      callbacks: callbacks
    }

  }

  _runIfTimerExists(f) {
    if(this.timer)
      return f.call();
    else
      console.log("Timer has not been launched yet!");
  }

}
window.webface.component_classes["TimerComponent"] = TimerComponent;
