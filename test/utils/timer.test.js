import '../webface_init.js'
import { Timer, CountdownTimer, StopwatchTimer } from '../lib/utils/timer.js'

describe("Timer", function() {

  var timer;

  describe("Timer descendant", function() {

    beforeEach(function() {
      timer = new CountdownTimer({ duration: 1500, time_unit: "ms", step_time: 100 });
    });

    afterEach(function() {
      timer.finish();
    });

    describe("dealing with time", function() {

      it("starts counting steps and sets started property to true", function() {
        timer._countStep = chai.spy();
        timer.start();
        chai.expect(timer.started).to.be.true;
        chai.expect(timer._countStep).to.have.been.called.once;
      });

      it("pauses, saving current pause time, so it can update the finish_at time on resume", function() {
        timer.start();
        timer.pause();
        chai.expect(timer.paused_at).to.be.within(Timer.time_now_in_ms, Timer.time_now_in_ms + 100);
      });

      it("resumes counting steps, updating the finish_at time - increasing it to the duration of the stop", function(done) {
        var old_finish_at = timer.finish_at;
        timer._countStep = chai.spy();
        timer.start();
        timer.start();
        timer.pause();
        setTimeout(() => {
          timer.resume();
          chai.expect(timer.paused_at).to.be.null;
          chai.expect(timer._countStep).to.have.been.called.twice;
          chai.expect(timer.finish_at).to.be.within(old_finish_at + 1, old_finish_at + 299);
          timer.finish();
          done();
        }, 200);
      });

      it("tells if the timer is on current step", function() {
        timer.start();
        chai.expect(timer.isOnCurrentStep(timer.start_at+50)).to.be.true;
        chai.expect(timer.isOnCurrentStep(timer.start_at+150)).to.be.false;
        chai.expect(timer.isOnCurrentStep(timer.start_at+250)).to.be.false;
      });

      it("converts current_time from time_unit (ms or seconds) into an object with human readable keys", function() {
        var ms = 1;
        var second = ms*1000;
        var minute = second*60;
        var hour   = minute*60;
        var day    = hour*24;
        var week   = day*7;
        Timer._current_time = timer.start_at;
        timer.finish_at = timer.start_at + ms + second + minute + hour + day + week;
        chai.expect(timer.currentTimeHuman({ largest_unit: "seconds" })).to.include({ ms: 1, seconds: (second+minute+hour+day+week)/second });
        chai.expect(timer.currentTimeHuman({ largest_unit: "minutes" })).to.include({ ms: 1, seconds: 1, minutes: (minute+hour+day+week)/minute });
        chai.expect(timer.currentTimeHuman({ largest_unit: "hours" })).to.include({ ms: 1, seconds: 1, minutes: 1, hours: (hour+day+week)/hour });
        chai.expect(timer.currentTimeHuman({ largest_unit: "days" })).to.include({ ms: 1, seconds: 1, minutes: 1, hours: 1, days: (day+week)/day });
        chai.expect(timer.currentTimeHuman({ largest_unit: "weeks" })).to.include({ ms: 1, seconds: 1, minutes: 1, hours: 1, days: 1, weeks: 1 });
        Timer._current_time = null;
      });

    });

    describe("callbacks", function() {

      it("runs the start callback on start", function() {
        timer.callbacks.start = chai.spy();
        timer.start();
        chai.expect(timer.callbacks.start).to.have.been.called.once;
      });

      it("runs the pause callback on pause", function() {
        timer.callbacks.pause = chai.spy();
        timer.start();
        timer.pause();
        chai.expect(timer.callbacks.pause).to.have.been.called.once;
      });

      it("runs the resume callback on resuming", function() {
        timer.callbacks.resume = chai.spy();
        timer.start();
        timer.pause();
        timer.resume();
        chai.expect(timer.callbacks.resume).to.have.been.called.once;
      });

      it("runs the finish callback when timer finishes", function() {
        timer.callbacks.finish = chai.spy();
        timer.start();
        timer.finish();
        chai.expect(timer.callbacks.finish).to.have.been.called.once;
      });

      it("runs a step callback on each step", function(done) {
        timer.callbacks.step = chai.spy();
        timer.start(); // steps countdown started!
        setTimeout(() => {
          chai.expect(timer.callbacks.step).to.have.been.called.once;
          timer.finish();
          done();
        }, 99); // 99 less than one step, thus step callback is called only once, on start
      });

    });

  });

  describe("CountdownTimer", function() {

    beforeEach(function() {
      timer = new CountdownTimer({ duration: 1500, time_unit: "ms", step_time: 100 });
    });

    it("returns time left until finish in seconds", function() {
      chai.expect(timer.current_time).to.be.within(1300, 1500);
    });

    it("runs callbacks at specific time points on the overall time the timer is allowed to run", function(done) {
      var time_point_spy = chai.spy();

      // 1450 actually means run on step one, since we have a CountdownTimer and its duration 1500ms.
      timer.callbacks.time_points = [[1450, time_point_spy], [1000, time_point_spy]];

      timer.start();
      setTimeout(() => {
        chai.expect(time_point_spy).to.have.been.called.once;
        timer.finish();
        done();
      }, 120);
    });

  });

  describe("StopwatchTimer", function() {

    beforeEach(function() {
      timer = new StopwatchTimer({ time_unit: "ms", step_time: 100 });
    });

    it("returns time passed since the start in seconds", function() {
      timer.start_at = Timer.time_now_in_ms - 1500;
      chai.expect(timer.current_time).to.be.within(1500, 1700);
    });

    it("runs callbacks at specific time points on the overall time the timer is allowed to run", function(done) {
      var time_point_spy = chai.spy();
      timer.callbacks.time_points = [[50, time_point_spy], [500, time_point_spy]];
      timer.start();
      setTimeout(() => {
        chai.expect(time_point_spy).to.have.been.called.once;
        timer.finish();
        done();
      }, 120);
    });

  });

});
