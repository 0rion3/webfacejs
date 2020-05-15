import PublicPromise from '../../utils/public_promise.js'
import StateManager  from './state_manager.js'

export default class StateActionManager extends StateManager {

  static get short_name() { return "action" }

  applyTransitionsNow(transitions) {
    var promises = [];
    var self = this.component;

    transitions.forEach((transitions) => {
      if(transitions == null) return;
      if(transitions.constructor !== Array) transitions = [transitions];
      transitions.forEach((t) => {
        if(typeof t === "string") {
          if(t.includes(".")) {
            var method_name, submethod_name;
            [method_name, submethod_name] = t.split(".");
            promises.push(this.component[method_name]()[submethod_name]());
          } else {
            promises.push(this.component[t]());
          }
        } else {
          promises.push(t());
        }
      });
    });
    return Promise.all(promises);
  }

  _expandTransitions(transitions) {
    if(transitions.constructor === Array) { // This is just a list of transitions, most likely they're all "in" transitions
      var in_transitions  = [];
      var out_transitions = [];
      transitions.forEach((t) => {
        if(t[0] == "*") { // But if we see an asterisk, we have to separate that transition into an "in" and "out" transition.
          in_transitions.push(t.substr(1) + ".in");
          out_transitions.push(t.substr(1) + ".out");
        } else {
          in_transitions.push(t);
        }
      });
      return { in: in_transitions, out: out_transitions, run_before: [], run_after: [] };
    } else {
      return transitions;
    }
  }

}
