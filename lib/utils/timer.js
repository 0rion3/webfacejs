import { MethodImplementationMissingError } from "../errors.js";

export class Timer {

  static get time_now_in_seconds() {
    return Math.round(Timer.time_now_in_ms / 1000);
  }

  static get time_now_in_ms() {
    return new Date().getTime();
  }

  // Converts seconds into weeks, days, hours, minutes and seconds
  // returns a simple javascript object with respective keys above.
  // Doesn't convert to months or years as months and years can
  // contain variable number of days.
  static humanTime(t, { largest_unit="weeks", time_unit_multiplier=1000 }={}) {

    function pad(num, size=2) {
      var s = num.toString();
      while (s.length < size) s = "0" + s;
      return s;
    }

    function count_time_units(t) {
      var time = { ms: t };
      time.seconds = Math.floor(time.ms/1000);
      if(time_unit_multiplier == 1)
        time.ms = time.ms%1000;
      else
        delete time.ms;

      if(largest_unit == "seconds" || time.seconds < 60) return time;

      time.minutes = Math.floor(time.seconds/60);
      time.seconds = time.seconds%60
      if(largest_unit == "minutes" || time.minutes < 60) return time;

      time.hours   = Math.floor(time.minutes/60);
      time.minutes = time.minutes%60
      if(largest_unit == "hours" || time.hours < 24) return time;

      time.days  = Math.floor(time.hours/24);
      time.hours = time.hours%24
      if(largest_unit == "days" || time.days < 7) return time;

      time.weeks = Math.floor(time.days/7);
      time.days  = time.days%7
      return time;
    }

    var time = count_time_units(t);
    for(let k in time)
      time[k] = time[k].toString();

    ["seconds", "minutes", "hours"].forEach(unit => {
      if(time[unit]) time[unit] = pad(time[unit], 2);
    });
    if(time["ms"]) time["ms"] = pad(time["ms"], 3);

    return time;

  }

  constructor({ start_at=null, duration=null, step_time=1, time_unit="second", callbacks={}}={}) {

    if(time_unit == "second")
      this.time_unit_multiplier = 1000;
    else if(["ms", "millisecond"].includes(time_unit))
      this.time_unit_multiplier = 1;
    else
      throw Error(`Time unit '${time_unit}' is not supported by ${this.constructor.name}`);

    if(start_at == null)
      this.start_at = Timer.time_now_in_ms;
    else
      this.start_at = this.timeInMs(start_at);

    if(duration) {
      this.duration  = this.timeInMs(duration);
      this.finish_at = this.start_at + this.duration;
    }

    this.step_time = this.timeInMs(step_time);
    this.callbacks = callbacks;

    // Convert time point callbacks to ms
    this.prepareTimePointCallbacks();

  }

  get current_time() {
    throw MethodImplementationMissingError("current_time", this.constructor.name);
  }

  get is_running() {
    return this.started && !this.finished
  }

  timeInMs(t) {
    return t*this.time_unit_multiplier;
  }

  start()  {
    if(!this.started) {
      this.started = true;
      this._countStep(Timer.time_now_in_ms);
      this._runCallback("start");
    }
    return this;
  }

  pause()  {
    if(this.started && this.paused_at == null) {
      this.paused_at = Timer.time_now_in_ms;
      this._runCallback("pause");
   }
  }

  resume() {
    if(this.paused_at != null) {
      let pause_duration = this._roundTimeToStep(Timer.time_now_in_ms - this.paused_at);
      if(this.finish_at)
        this.finish_at = this.finish_at + pause_duration;
      this.start_at = this.start_at + pause_duration;
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

  humanTime({ largest_unit="weeks" }={}) {
    return Timer.humanTime(this.current_time, { largest_unit: largest_unit, time_unit_multiplier: this.time_unit_multiplier });
  }

  _runCallback(c) {
    if(this.callbacks[c] != null)
      this.callbacks[c](this, c);
    else if(this.callbacks.default != null)
      this.callbacks.default(this, c);
  }

  _countStep(t) {
    if(this.is_running) {
      setTimeout(() => this._countStep(t+this.step_time), this.step_time);

      // Ignore callbacks if we're paused
      if(this.paused_at) return;

      if(this.finish_at && this.finish_at <= Timer.time_now_in_ms)
        this.finish();
      this.step_started_at = t;

      // After we're sure we're not paused, let's run callbacks. First, the "step"
      // callback which is calle regardless on each step and its purpose is to
      // allow you to update your sceen with current timer time, most likely.
      this._runCallback("step");
      // Then run callbacks for specific time points
      if(this.callbacks.time_points) {
        this.callbacks.time_points.forEach((point) => {
          var time = this.start_at + point[0] + this.step_time;
          var callback = point[1];
          if(this.isOnCurrentStep(time))
            callback();
        }, this);
      }

    }
  }

  _roundTimeToStep(t) {
    return Math.round(t/this.step_time)*this.step_time;
  }

}

// Countdown backwards until it reaches 0.
export class CountdownTimer extends Timer {

  constructor({ start_at=null, duration=null, step_time=1, time_unit="second", callbacks={}}={}) {
    if(duration == null) throw Error("Missing 'duration' argument: you must provide it for CountdownTimer");
    super({ start_at: start_at, duration: duration, step_time: step_time, time_unit: time_unit, callbacks: callbacks });
  }

  get current_time() {
    var t = this.finish_at - this.step_started_at;
    if(t < 0) return 0;
    else      return t; 
  }

  // Invert time point callbacks
  prepareTimePointCallbacks() {
    if(this.callbacks.time_points) {
      this.callbacks.time_points = this.callbacks.time_points.map(point => {
        return [this.finish_at - this.start_at - this.timeInMs(point[0]), point[1]];
      }, this);
    }
  }

}

// Countdown up forever or until it reaches the end
export class StopwatchTimer extends Timer {

  get current_time() {
    var t = this.step_started_at - this.start_at;
    if(t > this.duration) // Fixes a slight offset that's sometimes inevitable, user never notices!
      return this.duration;
    else
      return t;
  }

  prepareTimePointCallbacks() {
    if(this.callbacks.time_points) {
      this.callbacks.time_points = this.callbacks.time_points.map(point => {
        return [this.timeInMs(point[0]), point[1]];
      }, this);
    }
  }

}
