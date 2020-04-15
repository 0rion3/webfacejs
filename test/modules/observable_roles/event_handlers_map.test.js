import { EventHandlersMap } from '../../lib/modules/observable_roles/event_handlers_map.js'

describe('observable_roles', function() {

  var original_event_handlers = {
    "updated" : {
      "#self"            : (self, p) => console.log('#updated event for self'),
      "#all"             : (self, p) => console.log('#updated event for all roles'),
      "dummy"            : (self, p) => console.log('#updated event for dummy'),
      "role1,role2"      : (self, p) => console.log('an #updated event for two roles')
    },
    "queued_event" : {
      "#all" : (self, p) => console.log('#queued_event for all children'),
    }
  };

  describe('EventHandlersMap', function() {

    var event_handlers;

    beforeEach(function() {
      event_handlers = new EventHandlersMap(original_event_handlers);
    });

    it('adds a single handler for role and event', function() {
      event_handlers.add({ role: 'role3', event: 'updated', handler: function() { print("role3#updated") }});
      chai.expect(event_handlers.map["updated"]["role3"]).to.not.be.undefined;
    });

    it('adds multiple handlers for multiple roles and events with the same method', function() {
      event_handlers.add([
        { role: 'role3', event: 'updated', handler: function() { print("role3#updated") }},
        { role: 'role4', event: 'updated', handler: function() { print("role4#updated") }}
      ]);
      chai.expect(event_handlers.map["updated"]["role3"]).to.not.be.undefined;
      chai.expect(event_handlers.map["updated"]["role4"]).to.not.be.undefined;
    });

    it('removes a single handler for role and event', function() {
      event_handlers.remove({role: 'dummy', event: 'updated'});
      chai.expect(event_handlers.map["updated"]["dummy"]).to.be.undefined;
    });

    it('adds and then removes multiple handlers for one role but many events', function() {
      event_handlers.addForRole('role4', {
        'updated': () => console.log("role4#updated"),
        'saved':   () => console.log("role4#saved"),
      });
      chai.expect(event_handlers.map["updated"]["role4"]).to.not.be.undefined;
      chai.expect(event_handlers.map["saved"]["role4"]).to.not.be.undefined;

      event_handlers.removeForRole('role4', ["updated", "saved"]);
      chai.expect(event_handlers.map["updated"]["role4"]).to.be.undefined;
      chai.expect(event_handlers.map["saved"]).to.be.undefined;
    });

    it('adds and then removes multiple handlers for one event but many roles', function() {
      event_handlers.addForEvent('saved', {
        'role5': () => console.log("role5#saved"),
        'role6': () => console.log("role6#saved"),
      });
      chai.expect(event_handlers.map["saved"]["role5"]).to.not.be.undefined;
      chai.expect(event_handlers.map["saved"]["role6"]).to.not.be.undefined;

      event_handlers.removeForEvent('saved', ["role5", "role6"]);
      chai.expect(event_handlers["saved"]).to.be.undefined;
    });

    it("adds handlers for multiple roles when specified in an object passed to the constructor", function() {
      chai.expect(event_handlers.map["updated"]["role1"]).to.not.be.undefined;
      chai.expect(event_handlers.map["updated"]["role2"]).to.not.be.undefined;
      chai.expect(event_handlers.map["updated"]["role1,role2"]).to.be.undefined;
    });

    it("adds multiple identical handlers for multiple events", function() {
      event_handlers.add({ role: 'role3', event: ['updated', 'saved'], handler: function() { cosole.log("role3#updated") }});
      chai.expect(event_handlers.map["updated"]["role3"]).to.not.be.undefined;
      chai.expect(event_handlers.map["saved"]["role3"]).to.not.be.undefined;
    });

    it("strores options along with handlers", function() {
      event_handlers.add({ role: 'role4', event: ['updated', 'saved'], handler: function() { print("role3#updated") }, options: { "special_option": true }});
      chai.expect(event_handlers.map["updated"]["role4"][0]["options"]["special_option"]).to.be.true;
      chai.expect(event_handlers.map["saved"]["role4"][0]["options"]["special_option"]).to.be.true;
    });

    it("checks whether an event handler exists for the given role and event", function() {
      event_handlers.add({ role: 'role5', event: 'updated', handler: function() { cosole.log("role5#updated") }});
      chai.expect(event_handlers.hasHandlerFor({ role: 'role1', event: 'updated' })).to.be.true;
      chai.expect(event_handlers.hasHandlerFor({ role: 'role5', event: 'updated' })).to.be.true;
      chai.expect(event_handlers.hasHandlerFor({ role: 'role100', event: 'updated' })).to.be.false;
      chai.expect(event_handlers.hasHandlerFor({ role: '#self', event: 'updated' })).to.be.true;
      chai.expect(event_handlers.hasHandlerFor({ role: '#all', event: 'updated' })).to.be.true;
    });

  });

});
