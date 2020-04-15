/**
 * This class helps define/add/remove Event Handlers for Subscriber in a way that's
 * not completely ugly. Basically, event handlers is a 2-level Map, but it's difficult to manage it in a
 * reasonable way without resorting to traversing it in some ugly manner.
 *
 * Initially, a map may be passed to the constructor, but the idea is that actual users will use
 * it inside their classes constructors like this:
 *
 *   class MyComponent extends Subscriber {
 *
 *     constructor() {
 *       super();
 *       event_handlers.add(...);
 *       event_handlers.add_for_role('button', ...);
 *       event_handlers.add_for_event('click', ...);
 *     }
 *
 *   }
 *
**/

export class EventHandlersMap {

  constructor(sourcemap={}) {
    this.map = this._splitMultipleRoleHandlers(sourcemap);
    this.map = this._wrapHandlers(this.map);
  }

  // Allows us to pass both arrays and objects. When an array is passed, it means
  // we want to add multiple events/handlers at once.
  add(item) {
    if(!(item instanceof Array))
      item = [item];
    item.forEach(i => {
      this.addItem({ event: i.event, role: i.role, handler: i.handler, options: i.options });
    }, this);
  }

  remove({event=null, role=null}={}) {
    if(typeof event === 'string')
      event = [event];
    event.forEach(function(e) {
      if(this.map.hasOwnProperty(e) && this.map[e].hasOwnProperty(role)) {
        delete this.map[e][role];
      }
      if(this.map[e] != null && Object.keys(this.map[e]).length === 0) {
        delete this.map[e];
      }
    }, this);
  }

  addForRole(role, handlers, { options=null }={}) {
    for(let e in handlers)
      this.add({event: e, role: role, handler: handlers[e], options: options});
  }

  removeForRole(role, handlers) {
    handlers.forEach(function(e) {
      this.remove({event: e, role: role});
    }, this);
  }

  addForEvent(event, handlers, { options=null }={}) {
    for(let r in handlers)
      this.add({event: event, role: r, handler: handlers[r], options: options});
  }

  removeForEvent(event, handlers) {
    handlers.forEach(function(r) {
      this.remove({event: event, role: r});
    }, this);
  }

  hasHandlerFor({role=null, event=null}={}) {
    return (
      this.map[event] != null &&
      this.map[event][role] != null &&
      (
        (this.map[event][role] instanceof Array && this.map[event][role].length > 0) ||
        typeof this.map[event][role] === "function"
      )
    );
  }

  // This method isn't supposed to be public, always add() which allows to
  // add both a single event handler for event/role as well as multiple.
  // This method can only add one handler at a time.
  _addItem({event=null, role="#self", handler=null, options=null}={}) {
    if(typeof event === 'string')
      event = [event];

    event.forEach(function(e) {
      if(!this.map.hasOwnProperty(e))
        this.map[e] = {};

      // Events may have multiple event handlers defined for them,
      // thus there's actually an array of handlers to be invoked.
      //
      // Important to note, then when invoked, we must check whether the handler is an array
      // or a function. It may be both because handlers passed in sourcemap are not wrapped in an array
      // as this would complicated it fort the users of the class.
      if(!this.map[e].hasOwnProperty(role))
        this.map[e][role] = [];
      this.map[e][role].push({ "handler": handler, "options": options });
    }, this);

  }

  _splitMultipleRoleHandlers(sourcemap) {
    for(let e in sourcemap) {
      for(let r in sourcemap[e]) {
        if(r.includes(',')) {
          let roles = r.split(",");
          roles.forEach(function(r2) {
            sourcemap[e][r2] = sourcemap[e][r];
          }, this);
          delete sourcemap[e][r];
        }
      }
    }
    return sourcemap;
  }

  _wrapHandlers(sourcemap) {
    for(let e in sourcemap) {
      for(let r in sourcemap[e]) {
        if(!(sourcemap[e][r] instanceof Array))
          sourcemap[e][r] = [ { "handler": sourcemap[e][r] }];
      }
    }
    return sourcemap;
  }

}
