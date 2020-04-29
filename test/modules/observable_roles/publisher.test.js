import extend_as        from '../../lib/utils/mixin.js'
import Publisher        from '../../lib/modules/observable_roles/publisher.js'
import Subscriber       from '../../lib/modules/observable_roles/subscriber.js'
import EventHandlersMap from '../../lib/modules/observable_roles/event_handlers_map.js'

class PublisherDummy extends extend_as("PublisherDummy").mixins(Publisher) {}
class SubscriberDummy extends extend_as("SubscriberDummy").mixins(Subscriber) {

  constructor() {
    super();
    this.event_handlers_calls = [];
    this.event_handlers = new EventHandlersMap({
      "updated" : {
        "#all" : (self, p) => self.event_handlers_calls.push('#updated event for all roles')
      }
    });
  }

}

describe('observable_roles', function() {

  describe('Publisher', function() {

    var subscriber;
    var publisher;

    beforeEach(function() {
      subscriber = new SubscriberDummy();
      publisher  = new PublisherDummy();
    });

    it('publisher allows subscribers to be added into and removed from its list of subscribers', function() {
      var subscriber2 = new SubscriberDummy();
      subscriber2.event_handlers.add({ event: "click", role: "role1", handler: () => console.log("button clicked") });
      publisher.addObservingSubscriber(subscriber);
      publisher.addObservingSubscriber(subscriber2);
      chai.expect(publisher.observing_subscribers).to.include(subscriber);
      publisher.removeObservingSubscriber(subscriber);
      chai.expect(publisher.observing_subscribers).to.not.include(subscriber);
      chai.expect(publisher.observing_subscribers).to.include(subscriber2);
      chai.expect(() => publisher.add('Not a subscriber')).to.throw();
    });

    it('publisher notifies all subscribers of a new event, subscribers react to events from publishers by running callbacks', function() {
      publisher.addObservingSubscriber(subscriber);
      publisher.publishEvent('updated');
      chai.expect(subscriber.event_handlers_calls).to.include('#updated event for all roles');
    });

  });

});
