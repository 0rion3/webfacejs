/** Event locks allow you to prevent similar events being handled twice
  * until the lock is removed. This is useful, for example, to prevent
  * button being clicked twice and, consequently, a form being submitted twice.
  */
export { EventLock as default }
const EventLock = (EventLock) => class extends EventLock {

  set event_lock_for(events) {
    this._event_lock_for = new Set();
    events.forEach((event_arr) => {
      if(!(event_arr instanceof Array))
        event_arr = [event_arr];
      event_arr.forEach((e) => this._event_lock_for.add(e));
    });
  }

  set event_locks(locks) {
    this._event_locks = new Set();
    locks.forEach((e) => this._event_locks.add(e));
  }

  get event_locks() {
    this._event_locks();
  }

  get event_lock_for() { return this._event_lock_for; }
  get event_locks()    { return this._event_locks;    }

  constructor() {
    super();
    /// Defines which events to use locks for
    this.event_lock_for = [];
    /// Stores the locks themselves. If event name is in this List, it's locked.
    this.event_locks    = [];
  }

  /** Adds a new event lock. In case the event name is not on the event_lock_for List,
      the lock wouldn't be set. If you want the lock to be set anyway,
      just use the event_locks propety directly.
   */
  addEventLock(event_name, { publisher_roles=null, force=false }={}) {
    var event_names = this._prepareFullEventNames(event_name, { publisher_roles: publisher_roles });
    event_names.forEach(function(en) {
      if(this._event_lock_for.has(en) || force)
        this._event_locks.add(en);
    }, this);
  }

  removeEventLock(event_name, { publisher_roles=null }={}) {
    var event_names = this._prepareFullEventNames(event_name, { publisher_roles: publisher_roles });
    event_names.forEach((en) => this._event_locks.delete(en), this);
  }

  hasEventLock(event_name) {
    if(!(event_name instanceof Array))
      event_name = [event_name];
    for(let i in event_name)
      return this._event_locks.has(event_name[i]);
  }

  _prepareFullEventNames(event_name, { publisher_roles=null }={}) {
    var original_event_names = event_name;
    if(!(event_name instanceof Array))
      original_event_names = [event_name];

    var event_names = new Set();

    if(publisher_roles == null) {
      original_event_names.forEach(e => event_names.add(e));
    } else {
      if(typeof publisher_roles == 'string')
        publisher_roles = [publisher_roles];
      publisher_roles.forEach(function(r) {
        if(r == "#self")
          original_event_names.forEach(e => event_names.add(e));
        else
          original_event_names.forEach(e => event_names.add(`${r}.${e}`));
      });
    }
    return event_names;
  }

}
