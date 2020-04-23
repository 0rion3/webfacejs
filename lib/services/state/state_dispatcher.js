import { StateAliasManager   } from "./state_alias_manager.js";
import { StateActionManager  } from "./state_action_manager.js";
import { DisplayStateManager } from "./display_state_manager.js";
import { TypeChecker         } from "../../utils/type_checker.js";

export class StateDispatcher {

  constructor(c) {

    this.state_managers = {};
    this.component      = c;
    this._sortComponentStatesByManagers(c.states);

    this.sorted_states.forEach((manager_and_states) => {
      var manager_class = manager_and_states[0];
      var states        = manager_and_states[1];
      this.state_managers[manager_class.short_name] = new manager_class({
        component:     c,
        alias_manager: this.state_managers.alias,
        states:        states,
        settings:      this.manager_settings[manager_class.short_name]
      });
    });

  }

  // Called by the component whenever attributes are changed. It then decides in which sequence to call
  // applyTransition() on each individual state manager.
  applyTransitions() {

  }

  _sortComponentStatesByManagers(states) {
    var manager                        = StateAliasManager;
    var previous_item_was_manager_name = false;
    var previous_state_declaration     = null;
    this.sorted_states                 = [[StateAliasManager, []]];
    this.manager_settings              = { alias: {} };
    this.before_after_instructions     = {};

    states.forEach((s) => {
      if(typeof s === "string") {
        // We're dealing with one of the standard StateManagers!
        switch(s) {
          case "actions": manager = StateActionManager;  break;
          case "display": manager = DisplayStateManager; break;
        }
        this.sorted_states.push([manager, []]);
        previous_item_was_manager_name = true;

      } else if(s.constructor === Array) {
        // It's state declaration - add it to the currently selected state manager
        this.sorted_states[this.sorted_states.length-1][1].push(s);
        previous_state_declaration = s;

      } else if(TypeChecker.isSimpleObject(s) && manager === StateAliasManager) {
        // It's an alias for StateAliasManager
        this.sorted_states[this.sorted_states.length-1][1] = s;

      } else if(TypeChecker.isSimpleObject(s) && previous_item_was_manager_name) {
        // It's settings Object for the currently selected state manager
        this.manager_settings[manager.short_name] = s;
        previous_item_was_manager_name = false;

      } else if(TypeChecker.isSimpleObject(s) && (s.before || s.after) != null) {
        // It's a before/after instruction which forces the transition for this particular state/state manager
        // to be run before/after another state manager transition is applied.
        if(this.before_after_instructions[manager.short_name] == null)
          this.before_after_instructions[manager.short_name] = [];
        this.before_after_instructions[manager.short_name].push({ ...s, ...{ state_description: previous_state_declaration[0] }});

      } else { // We're dealing with custom state manager and its class that has been passed here.
        manager = s;
        this.sorted_states.push([manager, []]);
        previous_item_was_manager_name = true;
      }

    });
  }

}
