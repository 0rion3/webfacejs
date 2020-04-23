import { StateManager } from "./state_manager.js";

export class StateActionManager extends StateManager {

  static get short_name() { return "action" }

  constructor({ component=null, alias_manager=null, states=[], settings={}}={}) {
    super({ component: component, alias_manager: alias_manager, states: states});
  }

  applyTransition() {
    var promise = super.applyTransition();
    this._runTransitions(this.out_transitions_for_current_state).then(() => {
      this._runTransitions(this.pickTransitionsForState()).then(() => {
        promise.resolve();
      });
    });
    return promise;
  }

  _runTransitions(transitions) {
    var promises = [];
    var self = this.component;

    if(transitions == null)
      return new Promise((resolve) => resolve());

    transitions.forEach((transitions) => {
      if(transitions.constructor !== Array) transitions = [transitions];
      transitions.forEach((t) => {
        if(typeof t === "string")
          promises.push(this.component[t]());
        else
          promises.push(t());
      });
    });
    return Promise.all(promises);
  }

}
