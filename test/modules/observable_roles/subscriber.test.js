import { extend_as }        from '../../lib/utils/mixin.js'
import { Subscriber }       from '../../lib/modules/observable_roles/subscriber.js'
import { Publisher }        from '../../lib/modules/observable_roles/publisher.js'
import { EventHandlersMap } from '../../lib/modules/observable_roles/event_handlers_map.js'

class PublisherDummy  extends extend_as("PublisherDummy").mixins(Publisher) {}
class SubscriberDummy extends extend_as("SubscriberDummy").mixins(Subscriber) {

  constructor() {
    super();
    this.event_handlers_calls = [];
    this.event_handlers = new EventHandlersMap({
      "updated" : {
        "#self"            : (self, p) => self.event_handlers_calls.push('#updated event for self'),
        "#all"             : (self, p) => self.event_handlers_calls.push('#updated event for all roles'),
        "dummy"            : (self, p) => self.event_handlers_calls.push('#updated event for dummy'),
        "role1,role2"      : (self, p) => self.event_handlers_calls.push('an #updated event for two roles'),
        "role3"            : (self, p) => self.event_handlers_calls.push('an #updated event for two roles')
      },
      "queued_event" : {
        "#all" : (self, p) => self.event_handlers_calls.push('#queued_event for all children'),
      }
    });

    this.event_handlers.add({
      role: 'role7', event: 'deleted',
      handler: (self, p) => self.event_handlers_calls.push('a #deleted event for role7')
    });

    this.event_handlers.add({ role: "role8", event: "deleted", handler: (self,p) => self.event_handlers_calls.push('a #deleted #1 event for role8') });
    this.event_handlers.add({ role: "role8", event: "deleted", handler: (self,p) => self.event_handlers_calls.push('a #deleted #2 event for role8') });

  }

}

describe('observable_roles', function() {

  describe('Subscriber', function() {

    var subscriber;
    var publisher;

    beforeEach(function() {
      subscriber = new SubscriberDummy();
      publisher  = new PublisherDummy();
    });

    it('uses a particular role for handling the published event', function() {
      publisher.roles = ['dummy'];
      publisher.addObservingSubscriber(subscriber);
      publisher.publishEvent("updated");
      chai.expect(subscriber.event_handlers_calls).to.include("#updated event for dummy");
    });
    
    it('queues events when it is locked', function() {

      publisher.addObservingSubscriber(subscriber);

      subscriber.listening_lock = true;
      publisher.publishEvent('queued_event');
      publisher.publishEvent('queued_event');
      chai.expect(subscriber.events_queue.length).to.equal(2);
      chai.expect(subscriber.event_handlers_calls).to.not.include("#queued_event for all children");

      subscriber.listening_lock = false;
      chai.expect(subscriber.events_queue.length).to.equal(0);
      chai.expect(subscriber.event_handlers_calls).to.include("#queued_event for all children");
    });

    it('handles events from two different children with two different roles using the same handler', function() {
      var publisher1 = new PublisherDummy();
      var publisher2 = new PublisherDummy();
      publisher1.roles = ['role1'];
      publisher2.roles = ['role2'];
      publisher1.addObservingSubscriber(subscriber);
      publisher2.addObservingSubscriber(subscriber);
      publisher1.publishEvent('updated');
      publisher2.publishEvent('updated');
      chai.expect(subscriber.event_handlers_calls[0]).to.include("an #updated event for two roles");
      chai.expect(subscriber.event_handlers_calls[1]).to.include("an #updated event for two roles");
    });

    it('handlers added with EventHandlersMap methods are invoked correctly', function() {
      publisher.roles = ['role7'];
      publisher.addObservingSubscriber(subscriber);
      publisher.publishEvent('deleted');
      chai.expect(subscriber.event_handlers_calls).to.include("a #deleted event for role7");
    });

    it("ignores an event if there's no handler for it", function() {
      publisher.addObservingSubscriber(subscriber);
      publisher.roles = ['dummy'];
      publisher.publishEvent('non-existent-event')
      publisher.roles = ['non-existent-role'];
      publisher.publishEvent('non-existent-event');
    });

    it("allows to add multiple handlers for each event/role", function() {
      publisher.roles = ['role8'];
      publisher.addObservingSubscriber(subscriber);
      publisher.publishEvent('deleted');
      chai.expect(subscriber.event_handlers_calls).to.include('a #deleted #1 event for role8');
      chai.expect(subscriber.event_handlers_calls).to.include('a #deleted #2 event for role8');
    });


  });

});
