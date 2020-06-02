import TypeChecker   from '../../utils/type_checker.js'
import PublicPromise from '../../utils/public_promise.js'
import string_utils  from '../../utils/string_utils.js'
import array_utils   from '../../utils/array_utils.js'
import map_utils     from '../../utils/map_utils.js'
import assert        from '../../utils/standart_assertions.js'

/* This class is supposed to be inherited from. Examples are DisplayStateManager and StateActionManager.
 * By itself, it cannot do much, but it provides all the essential methods to take care of state declarations
 * and matching those to actual state.
 */
export default class StateManager {

  // First things first. Let's get the terminology straight:
  //
  // * state definition  -   a set of attributes and their values that defines a state for the component.
  //                         It's how we now a component is in a certain state by checking those attributes and values
  //                         and seeing that their values match the ones in the definition.
  //                         For example, this is a state definition:
  //
  //                             { attr1: "value1", attr2: ["value2", "value3"] }
  //
  //                         It says that in order to be considered in that particular state, the component
  //                         needs to have its attr1 value be equal to "value1" AND its attr2 value be equal to
  //                         either "value2" or "value3".
  //
  // * state transition    - this can be whatever it needs to be. Its use is defined by classes that extend
  //                         from this one. In the case of DisplayState manager it can be an Array of entity names
  //                         (component parts and children roles) that need to be hidden or shown.
  //
  //
  // * state declaration   - state definition + state transition + folded declarations (see below)
  //
  //                         To make things a bit more clear, suppose we're using a DisplayStateManager:
  //
  //                             [  { attr1: "value1", attr2: "value2" }, "some_important_button"  ]
  //                             |  |-----------------^----------------|  |----------^----------|  |
  //                             |            state definition                state transition     |
  //                             |-----------------------------------------------------------------|
  //                                                       state declaration
  //
  // * folded declarations - this is an Array containing state declarations that are "descendants" of the current one.
  //                         Say, we have an OrderComponent at our online store and two types of users.
  //                         The order knows which type of user he's currently dealing with thanks to its "user_role"
  //                         attribute and wants to show each user a "thank you for your business"
  //                         message, but only allow the buyer to leave a review, this only showing the review form
  //                         to the buyer. Here's a state declaration with a folded declaration:
  //
  //                            [{ status: "completed" }, "thank_you_message", [
  //                              { user_role: "seller" }, "review_purchase"
  //                            ]]
  //
  //                         This will effectively be translated into the following flat structure:
  //
  //                            [{ status: "completed" }, "thank_you_message"],
  //                            [{ status: "completed", user_role: "seller" }, "review"]
  //

  get short_name() { return this.constructor.short_name }
  get debug() {
    let debug = this.settings.debug;
    return (debug.log && (debug.exit_states || debug.enter_states || debug.transitions)) ? true : false
  }

  constructor({ component=null, alias_manager=null, states=[], settings={}}={}) {
    this.component       = component;
    this.alias_manager   = alias_manager;
    let default_settings = { pick_states_with_longest_definition_only: true,
                             debug: { log: false, exit_states: false, enter_states: false, transitions: false }
                           };
    this.settings        = { ...default_settings, ...settings };
    this.states          = this._expandFoldedStates(states);
    this.current_states  = [];
    this.enter_states    = [];
    this.exit_states     = [];

    if(!this.settings.debug.log) this.settings.debug = {};

    if(this.debug)
      this.print_debug("log", "DEBUG mode is ON!");
  }

  print_debug(type, data=[]) {

    var styles = 'background-color: #c9c9c9; color: #000; padding: 0.2em;';
    if(!this.debug || !this.settings.debug[type]) return;

    if(typeof data === "string")
      data = [data];
    var id = `${this.component.constructor.name}/state_manager/${this.short_name}`;
    if(type == "log") {
      console.log(`%c${id} * ${data.join('\n')}`, styles + " font-weight: bold;");
    } else {
      console.log(`  %c${id} --> ${type}:`, styles + " font-weight: bold;");

      var debug_text_lines = [];
      data.forEach((line) => {
        if(typeof line === "string")
          debug_text_lines.push(line);
        else
          console.log("  %c" + JSON.stringify(line), styles + " margin-left: 2.5em; background-color: #d5ffb0");
      });
      if(debug_text_lines.length > 0)
        console.log("  %c" + debug_text_lines.join(", "), styles + " margin-left: 2.5em; background-color: #d5ffb0");
    }

  }

  pickTransitionsForState({ include_current=false }={}) {
    this.print_debug("log", "picking new transitions for state...");

    var matches = [];
    for(let declaration of this.states) {
      let state_definition = declaration[0];
      let state_transition = this._processStateTransition(declaration[1]);
      let has_match        = true;

      for(let attr_name in state_definition) {
        if(!this._attrHasAcceptableValue(attr_name, state_definition[attr_name])) {
          has_match = false;
          break;
        }
      }

      if(has_match)
        matches.push(declaration);
    }
    this.current_transitions = this._pickTransitionsFromMatches(matches, { include_current: include_current });
    return this.current_transitions;
  }

  applyTransitions({ transitions=this.pickTransitionsForState() }={}) {
    var transitions_to_apply = [];
    ["out", "in"].forEach((k) => {
      if(transitions[k] && transitions[k].length > 0)
        transitions_to_apply.push(() => this.applyTransitionsNow(transitions[k]));
    });
    return PublicPromise.sequence(transitions_to_apply);
  }

  applyTransitionsNow() {
    throw "Implement applyTransitionNow() method in your StateManager descendant class!";
  }

  // Takes all the matches, checks their specificity and decides which ones
  // to include. Examples of how it works:
  //
  // "attr1" and "attr2" states both match - we include both of their transitions in the resulting list.
  // "attr1" and "attr1, attr2" match - we only include "attr1, attr2" transitions in the resulting list.
  // "attr1, attr2" and "attr1, attr2, attr3" match - we only include "attr1, attr2, attr3" transitions in the resulting list.
  // "attr1, attr2" and "attr2, attr3" match, we include both of their entitites in the resulting list.
  //
  _pickTransitionsFromMatches(matches, { include_current=false }={}) {
    var all_attr_names = matches.map(m => Object.keys(m[0]));

    if(this.settings.pick_states_with_longest_definition_only) {
      matches = matches.filter((m) => {
        let attr_names  = Object.keys(m[0]);
        let transitions = m[1];
        for(let attr_names2 of all_attr_names) {
          if(attr_names.length < attr_names2.length && attr_names.every(elem => attr_names2.indexOf(elem) > -1)) {
            return false;
          }
        }
        return true;
      });
    }

    if(include_current) {
      this.enter_states = this._concatStates(matches, this.current_states);
    } else {
      this.enter_states = this._subtractStates(matches, this.current_states);
    }
    this.exit_states    = this._subtractStates(this.current_states, matches);

    var run_after       = [];
    var run_before      = [];
    var in_transitions  = [];
    var out_transitions = this.exit_states.map((states) =>this._expandTransitions(states[1]).out);

    this.enter_states.forEach((states) => {
      let expanded_transition = this._expandTransitions(states[1]);
      in_transitions.push(expanded_transition.in);
      run_before.push(expanded_transition.run_before);
      run_after.push(expanded_transition.run_after);
    });

    this._updateCurrentStates();

    var result = {
      current:    array_utils.uniq(matches.map((m) => m[1]).flat(), { remove_null: true }),
      in:         array_utils.uniq(in_transitions.flat(),           { remove_null: true }),
      out:        array_utils.uniq(out_transitions.flat(),          { remove_null: true }),
      run_before: array_utils.uniq(run_before.flat(),               { remove_null: true }),
      run_after:  array_utils.uniq(run_after.flat(),                { remove_null: true })
    };

    if(this.debug) {
      this.print_debug("in_transitions",  result.in);
      this.print_debug("out_transitions", result.out);
      this.print_debug("exit_states",     this.exit_states.map((m)    => m[0]));
      this.print_debug("enter_states",    this.enter_states.map((m)   => m[0]));
      this.print_debug("current_states",  this.current_states.map((m) => m[0]));
    }

    return this._transitionsToApplyAfterStateChange(result);

  }

  // Reload this method in descendant classes to control which transitions
  // should be applied. For instance, we redefine it StateDisplayManager because it
  // actually hides ALL entities and every time that any state changes, we need to run
  // behave("show") on entities that are supposed to be visible - and so we need to call
  // transitions EVERY time state changes.
  _transitionsToApplyAfterStateChange(transitions) {
    return transitions;
  }

  _updateCurrentStates() {
    this.current_states = this._concatStates(this._subtractStates(this.current_states, this.exit_states), this.enter_states);
  }

  _subtractStates(states1, states2) {
    return this._removeDuplicateStates(states1, states2);
  }

  _concatStates(states1, states2) {
    var resulting_states = [];
    if(states2.length > states1.length)
      [states1, states2] = [states2, states1];
    states1 = this._removeDuplicateStates(states1, states2);
    return states1.concat(states2);
  }

  _expandTransitions(transitions) {
    if(transitions.constructor === Array) // This is just a list of "in" transitions.
      return { in: transitions, out: [], run_before: [], run_after: [] }
    else
      return transitions;
  }

  _removeDuplicateStates(states1, states2) {
    return states1.filter((s) => {
      var filter_result = true;
      for(let s2 of states2) {
        if(filter_result && map_utils.compare(s[0], s2[0]))
          filter_result = false;
      }
      return filter_result;
    });
  }

  _attrHasAcceptableValue(attr_name, v) {

    function prepareValues(assertion_name, values) {
      if(["is_in", "not_in"].includes(assertion_name)) {
        if(typeof values === "string")
          values = string_utils.toArrayOrObject(values);
        else if(TypeChecker.isFunction(values))
          values = [values()];
        values = values.map((assertion_v) => {
          return TypeChecker.isFunction(assertion_v) ? assertion_v() : assertion_v;
        });
        return values;
      } else {
        return TypeChecker.isFunction(values) ? values() : values;
      }
    }

    if(typeof v === "string" && !v.endsWith("()") || v.constructor === Array) {
      return this._attrHasAcceptableValue(attr_name, { is_in: v });
    } else if(typeof v === "string" && v.endsWith("()")) {
      return this._attrHasAcceptableValue(attr_name, assert[v.replace("()","")]);
    } else {
      // replace all old_[attr_name] values with _old_attr[name] so that
      // their values can be properly fetched with Component.get().
      if(attr_name.match(/^\.?old_/)) attr_name = attr_name.replace("old_", "_old_");

      // if we have a dot in attr name, it means we're dealing with a child component
      var c = this.component;
      if(attr_name.includes(".")) {
        var component_and_attr_name = attr_name.split(".");
        c = this.component.findFirstChildByRole(component_and_attr_name[0]);
        attr_name = component_and_attr_name[1];
      }

      if(TypeChecker.isFunction(v)) {
        return v(c.get(attr_name));
      // We check for Map here because on the second run,
      // it's always Map - on the first run an Object would be converted into a Map.
      } else if(TypeChecker.isSimpleObject(v) || v.constructor.name === "Map") {
        if(v.constructor.name !== "Map") v = map_utils.object_to_map(v);
        for(let assertion of v) {
          let assertion_values = prepareValues(assertion[0], assertion[1]);
          if(!assert[assertion[0]](c.get(attr_name), assertion_values)) return false;
        }
        return true;
      } else {
        return v === c.get(attr_name);
      }
    }
  }

  _expandFoldedStates(states, { parent=null, alias_prefix=null }={}) {
    var expanded_states = [];

    states.forEach(s => {

      // Before we expand folded states, we must first take care of
      // the definitions and expand those into separate declarations.
      this._expandDefinitionSet(s).forEach((state_declaration) => {
        var condition_set = state_declaration[0];

        // If we're getting a string, it means it's a state alias - as opposed to an Object, which
        // would represent a set of attributes and values describing this state - and we want to
        // replace this alias with the said Object, which this.expanded_component_states contains if
        // use the alias as a key.
        var alias;
        if(typeof condition_set === "string") {
          alias = alias_prefix ? `${alias_prefix}/${condition_set}`: condition_set;
          condition_set = this.alias_manager.states[alias];
        }

        let folded_states = state_declaration[2];
        state_declaration = [condition_set, string_utils.toArrayOrObject(state_declaration[1])];
        // If display state has a parent, mix all the entities it has into the current
        // declaration entities list.
        if(parent != null) {
          state_declaration[0] = { ...parent[0], ...condition_set };
          state_declaration[1] = string_utils.toArrayOrObject(parent[1]).concat(state_declaration[1]);
          state_declaration[1] = array_utils.uniq(state_declaration[1]);
        }

        expanded_states.push(state_declaration);

        if(folded_states) { // declaration Array has a third element, means it has folded states
          expanded_states = expanded_states.concat(
            this._expandFoldedStates(folded_states, { parent: state_declaration, alias_prefix: alias })
          );
        }
      }, this);
    }, this);

    return expanded_states;

  }

  _expandDefinitionSet(state) {

    var states_with_expanded_definitions = [];

    if(state[0].constructor === Array) {
      state[0].forEach(set => {
        let new_state = [set, state[1], state[2]];
        states_with_expanded_definitions.push(new_state);
      });
    } else {
      states_with_expanded_definitions.push(state);
    }

    return states_with_expanded_definitions;
  }

  // Overload this method in the class the descendant class.
  // This class has no idea what kind of object a transition is.
  _processStateTransition(t) { return t };

}
