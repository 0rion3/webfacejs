import { MethodImplementationMissingError } from "../errors.js";

export class Timer {

  static get time_now_in_seconds() {
    return Math.round(this.time_now_in_ms / 1000);
  }

  static get time_now_in_ms() {
    if(Timer._current_time != null)
      return Timer._current_time; // For testing purposes. Unfortunately it seems like it's not possible to stub a static getter.
    return new Date().getTime();
  }

  constructor({ start_at=null, duration=null, step_time=1, time_unit="second", callbacks={}, time_points=[]}={}) {

    if(time_unit == "second")
      this.time_unit_multiplier = 1000;
    else if(["ms", "millisecond"].includes(time_unit))
      this.time_unit_multiplier = 1;
    else
      throw Error(`Time unit '${time_unit}' is not supported by ${this.constructor.name}`);

    if(start_at == null)
      this.start_at = Timer.time_now_in_ms*this.time_unit_multiplier;
    else
      this.start_at = start_at;

    if(duration)
      this.finish_at = this.start_at + duration*this.time_unit_multiplier;

    this.change_step_time = this.change_step_time*this.time_unit_multiplier;
    this.step_time        = step_time*this.time_unit_multiplier;
    this.callbacks        = callbacks;
  }

  get current_time() {
    throw MethodImplementationMissingError("current_time", this.constructor.name);
  }

  get is_running() {
    return this.started && !this.paused_at && !this.finished
  }

  get time_point_callbacks() {
    return this.callbacks.time_points;
  }

  // Converts seconds into weeks, days, hours, minutes and seconds
  // returns a simple javascript object with respective keys above.
  // Doesn't convert to months or years as months and years can
  // contain variable number of days.
  currentTimeHuman({ largest_unit="weeks" }={}) {

    var time = { ms: this.current_time };

    if(this.time_unit_multiplier == 1) {
      time.seconds = Math.floor(time.ms/1000);
      time.ms      = time.ms%1000;
    } else {
      time.seconds = time.ms;
      delete time.ms;
    }
    if(largest_unit == "seconds") return time;

    time.minutes = Math.floor(time.seconds/60);
    time.seconds = time.seconds%60
    if(largest_unit == "minutes") return time;

    time.hours   = Math.floor(time.minutes/60);
    time.minutes = time.minutes%60
    if(largest_unit == "hours") return time;

    time.days  = Math.floor(time.hours/24);
    time.hours = time.hours%24
    if(largest_unit == "days") return time;

    time.weeks = Math.floor(time.days/7);
    time.days  = time.days%7
    return time;

  }

  start()  {
    if(!this.started) {
      this.started = true;
      this._runCallback("start");
    }
    this._countStep();
    return this;
  }

  pause()  {
    if(this.started && this.paused_at == null) {
      this.paused_at = Timer.time_now_in_ms*this.time_unit_multiplier;
      this._runCallback("pause");
   }
  }

  resume() {
    if(this.paused_at != null) {
      if(this.finish_at)
        this.finish_at = this.finish_at + (Timer.time_now_in_ms*this.time_unit_multiplier - this.paused_at);
      this.paused_at = null;
      this._runCallback("resume");
    }
  }

  finish() {
    this.finished = true;
    if(this.started) this._runCallback("finish");
  }

  // Tells you wether or not time that's been passed is within the current step
  // or not. For example if the timer step is 2 seconds and 3 seconds have passed
  // since the start then if we call isOnCurrentStep(t) where t == time since start + 2 seconds
  // then it will return true, because the second step
  isOnCurrentStep(t=Timer.time_now_in_seconds) {
    if(this.is_running) {
      var step_ends_at = this.step_started_at + this.step_time;
      return t >= this.step_started_at && t < step_ends_at;
    } else {
      return false;
    }
  }

  _runCallback(c) {
    if(this.callbacks[c] != null) this.callbacks[c]();
  }

  _countStep() {
    if(this.is_running) {

      this.step_started_at = Timer.time_now_in_ms*this.time_unit_multiplier;
      setTimeout(() => this._countStep(), this.step_time);
      this._runCallback("step");

      // Running callbacks for specific time points
      if(this.callbacks.time_points) {
        this.time_point_callbacks.forEach((point) => {
          var time = this.start_at + point[0]*this.time_unit_multiplier;
          var callback = point[1];
          if(this.isOnCurrentStep(time))
            callback();
        }, this);
      }

      if(this.finish_at && this.finish_at <= Timer.time_now_in_ms*this.time_unit_multiplier)
        this.finish();

    }
  }

}

// Countdown backwards until it reaches 0.
export class CountdownTimer extends Timer {

  constructor({ start_at=null, duration=null, step_time=1, time_unit="second", callbacks={}, time_points=[]}={}) {
    if(duration == null) throw Error("Missing 'duration' argument: you must provide it for CountdownTimer");
    super({ start_at: start_at, duration: duration, step_time: step_time, time_unit: time_unit, callbacks: callbacks, time_points: time_points });
  }

  get current_time() {
    return this.finish_at - Timer.time_now_in_ms*this.time_unit_multiplier;
  }

  get time_point_callbacks() {
    if(this._inverted_time_point_callbacks)
      return this._inverted_time_point_callbacks;
    this._inverted_time_point_callbacks = this.callbacks.time_points.map((point) => {
      return [this.finish_at - this.start_at - point[0], point[1]];
    });
    return this._inverted_time_point_callbacks;
  }

}

// Countdown up forever or until it reaches the end
export class StopwatchTimer extends Timer {
  get current_time() {
    return Timer.time_now_in_ms*this.time_unit_multiplier - this.start_at;
  }
}
