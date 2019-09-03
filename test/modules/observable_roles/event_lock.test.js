import { extend_as } from '../../lib/utils/mixin.js'
import { EventLock } from '../../lib/modules/observable_roles/event_lock.js'

class EventLockDummy extends extend_as("EventLockDummy").mixins(EventLock) {}

describe('observable_roles', function() {

  describe('EventLock', function() {

    var dummy;

    beforeEach(function() {
      dummy = new EventLockDummy();
      dummy.event_lock_for = ["click", "submit.click"];
    });

    it("adds an event lock", function() {
      dummy.addEventLock("click");
      dummy.addEventLock("click", { publisher_roles: "submit" });
      dummy.addEventLock("mouseover");
      dummy.addEventLock("mouseover", { publisher_roles: "submit" });
      chai.expect(dummy.event_locks).to.include("click");
      chai.expect(dummy.event_locks).to.include("submit.click");
      chai.expect(dummy.event_locks).to.not.include("mouseover");
      chai.expect(dummy.event_locks).to.not.include("submit.mouseover");
    });

    it("adds event locks in bulk", function() {
      dummy.event_lock_for = ["click", "mouseover", "submit.mouseover", "submit.click"];
      dummy.addEventLock(["click", "mouseover"]);
      dummy.addEventLock(["click", "mouseover"], { publisher_roles: "submit" });
      chai.expect(dummy.event_locks).to.include("click");
      chai.expect(dummy.event_locks).to.include("mouseover");
      chai.expect(dummy.event_locks).to.include("submit.click");
      chai.expect(dummy.event_locks).to.include("submit.mouseover");
    });

    it("adds event locks event names from array, flattens it", function() {
      dummy.event_lock_for = [["click", "touchend"]];
      chai.expect(dummy.event_lock_for).to.include("click");
      chai.expect(dummy.event_lock_for).to.include("touchend");
    });

    it("removes an event lock", function() {
      dummy.addEventLock("click");
      dummy.addEventLock("click", { publisher_roles: "submit" });
      chai.expect(dummy.event_locks).to.include("click");
      chai.expect(dummy.event_locks).to.include("submit.click");
      dummy.removeEventLock("click");
      dummy.removeEventLock("click", { publisher_roles: "submit1" });
      chai.expect(dummy.event_locks).to.not.include("click");
      chai.expect(dummy.event_locks).to.include("submit.click");
    });

    it("removes event locks in bulk", function() {
      dummy.event_lock_for = ["click", "mouseover", "submit.mouseover", "submit.click"];
      dummy.addEventLock(["click", "mouseover"]);
      dummy.addEventLock(["click", "mouseover"], { publisher_roles: "submit" });
      dummy.removeEventLock(["click", "mouseover"]);
      dummy.removeEventLock(["click", "mouseover"], { publisher_roles: "submit" });
      chai.expect(dummy.event_locks).not.to.include("click");
      chai.expect(dummy.event_locks).not.to.include("mouseover");
      chai.expect(dummy.event_locks).not.to.include("submit.click");
      chai.expect(dummy.event_locks).not.to.include("submit.mouseover");
    });

    it("checks if event has a lock", function() {
      dummy.addEventLock("click");
      dummy.addEventLock("click2");
      dummy.addEventLock("click", { publisher_roles: "submit" });
      chai.expect(dummy.hasEventLock("click")).to.be.true;
      chai.expect(dummy.hasEventLock("submit.click")).to.be.true;
      chai.expect(dummy.hasEventLock("click2")).to.be.false;
      chai.expect(dummy.hasEventLock(["click", "click2"])).to.be.true;
      chai.expect(dummy.hasEventLock(["click", "click3"])).to.be.true;
      chai.expect(dummy.hasEventLock(["click3", "click4"])).to.be.false;
    });

    it("allows for arrays to be used in event_lock_for", function() {
      dummy.event_lock_for = [["click", "touchend"]];
      dummy.addEventLock("click");
      dummy.addEventLock("touchend");
      dummy.addEventLock("mouseover");
      chai.expect(dummy.event_locks).to.include("click");
      chai.expect(dummy.event_locks).to.include("touchend");
      chai.expect(dummy.event_locks).to.not.include("mouseover");
    });

    it("modifies event_locks set diretctly", function() {
      dummy.event_locks.add("non_listed_lock");
      chai.expect(dummy.event_locks).to.include("non_listed_lock");
    });

  });

});
