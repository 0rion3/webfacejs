import { MethodImplementationMissingError } from '../errors.js';

export { Timer as default }
export class Timer {

  static get units() {
    return ["ms", "seconds", "minutes", "hours", "days", "weeks"];
  }

  static get time_now_in_seconds() {
    return Math.round(Timer.time_now_in_ms / 1000);
  }

  static get time_now_in_ms() {
    return new Date().getTime();
  }

  constructor({ start_at=null, duration=null, step_time=1, time_unit="seconds", callbacks={}}={}) {

    if(["second", "seconds"].includes(time_unit))
      this.time_unit_multiplier = 1000;
    else if(["ms", "millisecond", "milliseconds"].includes(time_unit))
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
      this._runCallback("start");
      if(this.finish_at && this.finish_at < Timer.time_now_in_ms)
        this.finish();
      else
        this._countStep(Timer.time_now_in_ms);
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

  // Converts seconds into weeks, days, hours, minutes and seconds
  // returns a simple javascript object with respective keys above.
  // Doesn't convert to months or years as months and years can
  // contain variable number of days.
  humanTime({
    largest_unit="weeks",
    smallest_unit=(this.time_unit_multiplier == 1 ? "ms" : "seconds"),
    time_unit_multiplier=this.time_unit_multiplier,
    unit_suffixes={ weeks: "w ", days: "d ", hours: ":", minutes: ":", seconds: ":", ms: "" }}={}
  ) {

    function pad(num, size=2) {
      var s = num.toString();
      while (s.length < size) s = "0" + s;
      return s;
    }

    function count_time_units(t) {
      var time = { ms: t, seconds: 0, minutes: 0, hours: 0, days: 0, weeks: 0 };
      if(largest_unit == "ms") return time;

      time.seconds = Math.floor(time.ms/1000);
      if(time_unit_multiplier == 1)
        time.ms = time.ms%1000;
      else
        time.ms = 0;

      if(largest_unit == "seconds") return time;

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

    var time = count_time_units(this.current_time);

    // Clean up everything below the smallest unit.
    // That is, if we say the smallest unit is minutes, we'll delete "seconds" and "ms" from the
    // resulting object.
    Timer.units.slice(0, Timer.units.indexOf(smallest_unit)).forEach((u)                   => delete time[u]);
    Timer.units.slice(Timer.units.indexOf(largest_unit)+1, Timer.units.length).forEach((u) => delete time[u]);

    for(let k in time)
      time[k] = time[k].toString();

    ["seconds", "minutes", "hours"].forEach(unit => {
      if(time[unit]) time[unit] = pad(time[unit], 2);
    });
    if(time["ms"]) time["ms"] = pad(time["ms"], 3);

    return time;
  }

  humanTimeAsString({
    largest_unit="weeks",
    time_unit_multiplier=this.time_unit_multiplier,
    smallest_unit=(this.time_unit_multiplier == 1 ? "ms" : "seconds"),
    unit_suffixes={}}={}
  ) {

    var default_unit_suffixes = { weeks: "w ", days: "d ", hours: ":", minutes: ":", seconds: ":", ms: "" };
    unit_suffixes = {...default_unit_suffixes, ...unit_suffixes };

    var ht = this.humanTime({ largest_unit: largest_unit, time_unit_multiplier: time_unit_multiplier, smallest_unit: smallest_unit });
    var ht_string = "";
    var units_reversed = Timer.units.reverse();
    units_reversed.forEach((u,i) => {
      if(ht[u] != null) {
        // This next line is somewhat odd, but I decided to hardcode this behavior.
        // If the suffix is ":", which is the standard hours:minutes:seconds separator and it's also
        // the smallest unit, we don't add the suffix to the end (which is something you'd expect), so
        // we don't get things like 00:05:09:
        let suffix = "";
        if(unit_suffixes[u] != null)
          suffix = (i == units_reversed.indexOf(smallest_unit) && unit_suffixes[u] == ":") ? "" : unit_suffixes[u];
        ht_string += ht[u] + suffix;
      }
    });
    return ht_string;
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

    // If duration is set to 0, it means we want to finish immediately.
    if(duration == 0) callbacks.finish();
  }

  get current_time() {
    var t = this.finish_at - this.step_started_at;
    if(this.finished || t < 0) return 0;
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
    if(this.finished || t > this.duration) // Fixes a slight offset that's sometimes inevitable, user never notices!
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
