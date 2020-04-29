import EventHandlersMap from './event_handlers_map.js'

/**
 * Watches publishers for events they emit, then reacts to each event by invoking event handlers.
 *
 * USAGE:
 *
 * 1. Define event handlers using the `event_handlers` attr in the constructor:
 *
 *   this.event_handlers = new EventHandlersMap({
 *     'mouseover' : {
 *       '#all':         (self, p) => print("A default event handler for all publishers, irrespective of their roles"),
 *       'button':       (self, p) => print("An event handler for publishers with the 'button' role only"),
 *       'button, link': (self, p) => print("An event handler for publishers with both 'button' AND 'link' roles")
 *     },
 *     'click' : {
 *       '#all' : (self, p) => print("A default event handler for all publishers, irrespective of their roles"),
 *     }
 *   }); 
 *
 * 2. Call `publishEvent('mouseover')` on the publisher.
 *
 * EXPLANATION:
 *
 * Subscriber objects are added into publisher's `Pubslisher#observing_subscribers` List.
 * Every time such a publisher publishes an event it makes sure our subscriber
 * is notified - that is achieved by calling the `captureEvent()` method.
 *
 * `captureEvent()` in turn, doesn't automatically execute the event handler,
 * but simply adds the event to queue. This is because we want to process events
 * one by one and the order of executing the handlers may matter. After the event
 * is added into the queue, it calls `_releaseQueuedEvents()` which invokes event
 * handlers for each event in the queue until it ends. Thus, it may happen so that
 * some calls to `_releaseQueuedEvents()` may actually be for nothing, since event B
 * previously added to the queue was released by the call made to `_releaseQueuedEvents()`
 * while event A was captured. This an unlikely situation, though.
 *
 * More importantly, each subscriber has a listening lock. When it's on (set to `true`),
 * events are captured (added to the queue), but handlers for them are not yet invoked.
 * as soon as the value of the listening lock changes to `false`, events start being released
 * by calling `_releaseQueuedEvents()`. This may be very useful in certain cases when
 * you have to make sure event handlers are invoked only when an object reaches a certain state,
 * but no earlier (example: process clicks only when the page is loaded).
 */
export { Subscriber as default }
const Subscriber = (Subscriber) => class extends Subscriber {

  constructor() {

    super();

    /// A map of functions serving as event handlers.
    ///
    /// Those are invoked each time an event with the specified key is fired
    /// by one of the publishers this subscriber watches.
    this.event_handlers = new EventHandlersMap();

    // Whenever this one is set to true, we put events in a waiting queue and wait
    // until it's true again - then it's going to publish the event.
    this._listening_lock = false;

    /// Keeps events that are currently on hold because of the publishers listening_lock 
    this.events_queue = [];

  }

  get listening_lock() { return this._listening_lock };

  set listening_lock(lock) {
    this._listening_lock = lock;
    if(lock == false) this._releaseQueuedEvents();
  } 

  /**
   * Captures event but does not execute it.
   * 
   * Instead, adds event to a queue,
   * then unless listening_lock is on, releases all of the queued events with
   * _releaseQueuedEvents(). Really, if listening lock is off, it may be just
   * this one event in the queue, but we have to be sure.
   */
  captureEvent(name, publisher_roles, { data=null }={}) {
    this.events_queue.push({ 'name': name, 'publisher_roles': publisher_roles, 'data': data});
    if(this.listening_lock == false) this._releaseQueuedEvents();
  }

  /**
   * Invokes an assigned event handler for the event, passes itself to it. 
   */
  handleEvent(handler_and_options,data=null) {
    handler_and_options["handler"](this, data);
  }

  /**
   * Releases all the events that were previously queued due to listening lock.
   * 
   * It checks for the lock on each event release, so if while the loop is running
   * someone elsewhere sets the listening lock, it breaks the loop and returns.
   */
  _releaseQueuedEvents() {
    while(!this.events_queue.length == 0 && this.listening_lock == false) {
      var e      = this.events_queue.shift();
      var events = this._pickEvent(e);
      if(events != null) {
        events.forEach(function(event) {
          this.handleEvent(event, e['data']);
        }, this);
      }
    }
    this._listening_lock = false;
  }

  /**
    * Picks an appropriate event handler from the subscriber to be called in response to an
    * event from the publisher. There are various possibilities for event handlers to be defined in subscriber.
    * This method assumes the following format for event handlers:
    *
    *   'update': {
    *     '#all':         (self, p) => print("A default event handler for all publishers, irrespective of their roles"),
    *     'button':       (self, p) => print("An event handler for publishers with the 'button' role only"),
    *     'button, link': (self, p) => print("An event handler for publishers with both 'button' AND 'link' roles")
    *   }
    *
  */
  _pickEvent(e) {
    var name            = e.name;
    var publisher_roles = e.publisher_roles;
    var data            = e.data;

    if(this.event_handlers.map[name] != null) {
      if(publisher_roles != null) {
        var picked_handler = null;
        publisher_roles.forEach(function(r) {
          if(Object.keys(this.event_handlers.map[name]).includes(r)) {
            picked_handler = this.event_handlers.map[name][r]; return; // Note the return here. Found a handler? That's it!
          }
        }, this);
        /// The returns above only return from the closure, but not from the method.
        /// Therefore, we need this additional variable and an additional return. Yes, this is the second time.
        /// Perhaps we need a bit more clarity in the code. Duh.
        if(picked_handler != null)
          return picked_handler;
      }
      /// Finally, if no handler for the publisher's roles exist, perhaps there's a default
      /// #all handler?
      if(this.event_handlers.map[name]['#all'] != null)
        return this.event_handlers.map[name]['#all'];
    }
  }

}
