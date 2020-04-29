import TypeChecker         from '../../utils/type_checker.js'
import PublicPromise       from '../../utils/public_promise.js'
import array_utils         from '../../utils/array_utils.js'
import StateAliasManager   from './state_alias_manager.js'
import StateActionManager  from './state_action_manager.js'
import DisplayStateManager from './display_state_manager.js'

export default class StateDispatcher {

  constructor(c) {

    this.state_managers           = {};
    this.component                = c;
    this._sortComponentStatesByManagers(c.states);
    this.state_managers           = new Map();
    this.children_roles_and_attrs = {};

    this.sorted_states.forEach((manager_and_states) => {
      var manager_class = manager_and_states[0];
      var states        = manager_and_states[1];
      this.state_managers.set(manager_class.short_name, new manager_class({
        component:     c,
        alias_manager: this.state_managers.get("alias"),
        states:        states,
        settings:      this.manager_settings[manager_class.short_name]
      }));
    });

    this.state_managers.forEach((sm, short_name) => {
      var declarations = (short_name == "alias") ? Object.values(sm.states) : sm.states.map(i => i[0]);
      declarations.forEach((d) => {
        this._extractChildComponentRolesAndAttrs(d);
      });
    });

    this._subscribeComponentToChildrenChanges();

  }

  // Called by the component whenever attributes are changed. It then decides in which sequence to call
  // applyTransition() on each individual state manager.
  applyTransitions() {

    if(this.lock) return;

    // First pick transitions for state to determin the order in which state should be
    // applying transitions. We'll know that because StateManager.pickTransitionsForState()
    // returns an Object with "run_before" and "run_after" keys, which contain arrays of
    // short names of state managers.
    var state_managers_and_picked_transitions = [];
    this.state_managers.forEach((state_manager, short_name) => {
      if(short_name != "alias") {
        state_managers_and_picked_transitions.push([
          short_name, state_manager.pickTransitionsForState()
        ]);
      }
    });

    var transition_applications = [];
    this._sortStateManagersByBeforeAfter(state_managers_and_picked_transitions).forEach((i) => {
      let sm          = this.state_managers.get(i[0]);
      let transitions = i[1];
      transition_applications.push(function() {
        return sm.applyTransitions({ transitions: transitions });
      });
    });
    return PublicPromise.sequence(transition_applications);
  }

  _sortStateManagersByBeforeAfter(arr) {

    var safety_counter = 0;

    while(true) {
      var item_moved = false;

      arr = arr.reverse();
      for(let i in arr) {
        for(let i2 in arr) {
          if(arr[i][1].run_before && arr[i][1].run_before.includes(arr[i2][0]) && i < i2) {
            array_utils.move(arr, i, i2);
            item_moved = true;
          }
        }
      }

      arr = arr.reverse();
      for(let i in arr) {
        for(let i2 in arr) {
          if(arr[i][1].run_after && arr[i][1].run_after.includes(arr[i2][0]) && i < i2) {
            array_utils.move(arr, i, i2);
            item_moved = true;
          }
        }
      }

      safety_counter += 1;
      if(safety_counter > 100) throw "Can't sort Component.states with run_before/run_after due to overriding conditions!" +
                                     "Sort attempts limit reached (100 times)"
      if(!item_moved) break;
    }

    return arr;
  }

  _sortComponentStatesByManagers(states) {
    var manager                        = StateAliasManager;
    var previous_item_was_manager_name = false;
    var previous_state_declaration     = null;
    this.sorted_states                 = [[StateAliasManager, []]];
    this.manager_settings              = { alias: {} };
    this.before_after_instructions     = {};
    this.state_manager_names_in_order  = [];

    states.forEach((s) => {
      if(typeof s === "string") {
        // We're dealing with one of the standard StateManagers!
        switch(s) {
          case "action" : manager = StateActionManager;  break;
          case "display": manager = DisplayStateManager; break;
        }
        this.sorted_states.push([manager, []]);
        previous_item_was_manager_name = true;

      } else if(s.constructor === Array && manager != StateAliasManager) {
        // It's state declaration - add it to the currently selected state manager
        this.sorted_states[this.sorted_states.length-1][1].push(s);
        previous_state_declaration = s;

      } else if(TypeChecker.isSimpleObject(s) && manager === StateAliasManager) {
        // It's an alias for StateAliasManager
        this.sorted_states[0][1] = s;

      } else if(TypeChecker.isSimpleObject(s) && previous_item_was_manager_name) {
        // It's settings Object for the currently selected state manager
        this.manager_settings[manager.short_name] = s;
        previous_item_was_manager_name = false;

      } else { // We're dealing with custom state manager and its class that has been passed here.
        manager = s;
        this.sorted_states.push([manager, []]);
        previous_item_was_manager_name = true;
      }

    });
  }

  _subscribeComponentToChildrenChanges() {
    // TODO: Note that this will subscribe the component to events FROM ALL child components that have this role,
    // but it will only check attributes on the first one. That's how it is right now. Will have to think how to change
    // that in the future.
    Object.keys(this.children_roles_and_attrs).forEach(role => {
      var child = this.component.findFirstChildByRole(role);
      this.children_roles_and_attrs[role].forEach(attr => {
        if(child.publish_changes_for != "#all" && !child.publish_changes_for.includes(attr)) {
          child.publish_changes_for.push(attr)
        }
      });
      this.component.event_handlers.add({ event: "change", role: role, handler: () => this.applyTransitions() });
    }, this);
  }

  _extractChildComponentRolesAndAttrs(state_definition) {
    Object.keys(state_definition).forEach((attr_name) => {
      if(attr_name.includes(".")) {
        let role_and_attr = attr_name.split(".");
        let role = role_and_attr[0];
        let attr = role_and_attr[1];
        if(this.children_roles_and_attrs[role] == null)
          this.children_roles_and_attrs[role] = [];
        if(!this.children_roles_and_attrs[role].includes(attr))
          this.children_roles_and_attrs[role].push(attr);
      }
    });
  }

}
