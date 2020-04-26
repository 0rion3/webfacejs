import { string_to_array_or_object } from "../../utils/string_helpers.js";
import { TypeChecker               } from "../../utils/type_checker.js";
import PublicPromise                 from "../../utils/public_promise.js";
import * as array_utils              from "../../utils/array_utils.js"
import * as map_utils                from "../../utils/map_utils.js"
import * as assert_value             from "../../utils/standart_assertions.js";

/* This class is supposed to be inherited from. Examples are DisplayStateManager and StateActionManager.
 * By itself, it cannot do much, but it provides all the essential methods to take care of state declarations
 * and matching those to actual state.
 */
export class StateManager {

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

  constructor({ component=null, alias_manager=null, states=[], settings={}}={}) {
    this.component       = component;
    this.alias_manager   = alias_manager;
    let default_settings = { pick_states_with_longest_definition_only: true };
    this.settings        = { ...default_settings, ...settings };
    this.states          = this._expandFoldedStates(states);
    this.current_states  = [];
    this.enter_states    = [];
    this.exit_states     = [];
  }

  pickTransitionsForState() {
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
    this.current_transitions = this._pickTransitionsFromMatches(matches);
    return this.current_transitions;
  }

  applyTransitions({ transitions=this.pickTransitionsForState(), external_promise=null}={}) {

    this._updateCurrentStates();

    // Resolves or rejects when transition is either completed or discarded.
    var transition_promise = new PublicPromise();

    if(external_promise)
      external_promise.then(() => this.applyTransitionsInSequence(
        [transitions.out, transitions.in], transition_promise
      ));
    else
      this.applyTransitionsInSequence(
        [transitions.out, transitions.in], transition_promise
      );

    transition_promise.then(() => transitions.called = true);
    return transition_promise;
  }

  applyTransitionsInSequence(transitions, transition_promise) {
    var promises = [];
    var promise  = new Promise(resolve => resolve());
    for(let i in transitions) {
      if(transitions[i] && transitions[i].length > 0) {
        promise.then(() => {
          promise = this.applyTransitionsNow(transitions[i]);
          promises.push(promise);
        });
      }
    }
    Promise.all(promises).then(() => transition_promise.resolve());
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
  _pickTransitionsFromMatches(matches) { // old name pickEntitiesForMatches

    var all_attr_names = matches.map(m => Object.keys(m[0]));

    var include = false;
    if(this.settings.pick_states_with_longest_definition_only) {

      matches = matches.filter((m) => {
        let attr_names  = Object.keys(m[0]);
        let transitions = m[1];
        let include     = true;
        for(let attr_names2 of all_attr_names) {
          if(attr_names.length < attr_names2.length && attr_names.every(elem => attr_names2.indexOf(elem) > -1)) {
            return false;
          }
        }
        return true;
      });
    }

    this.enter_states   = this._subtractStates(matches, this.current_states);
    this.exit_states    = this._subtractStates(this.current_states, matches);

    var run_after       = [];
    var run_before      = [];
    var in_transitions  = [];
    var out_transitions = this.exit_states.map((states)  => states[1].out);

    this.enter_states.forEach((states) => {
      let expanded_transition = this._expandTransition(states[1]);
      in_transitions.push(expanded_transition.in);
      run_before.push(expanded_transition.run_before);
      run_after.push(expanded_transition.run_after);
    });

    return {
      in:         array_utils.uniq(in_transitions.flat(),  { remove_null: true }),
      out:        array_utils.uniq(out_transitions.flat(), { remove_null: true }),
      run_before: array_utils.uniq(run_before.flat(),      { remove_null: true }),
      run_after:  array_utils.uniq(run_after.flat(),       { remove_null: true })
    };

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

  _expandTransition(t) {
    if(t.constructor === Array) // This is just a list of "in" transitions.
      return { in: t, out: [], run_before: [], run_after: [] }
    else
      return t;
  }

  _removeDuplicateStates(states1, states2) {
    return states1.filter((s) => {
      var filter_result = true;
      for(let s2 of states2) {
        if(filter_result && map_utils.compare_maps(s[0], s2[0]))
          filter_result = false;
      }
      return filter_result;
    });
  }

  _attrHasAcceptableValue(attr_name, v) {
    if(typeof v === "string" && !v.endsWith("()") || v.constructor === Array) {
      let values = string_to_array_or_object(v);
      return this._attrHasAcceptableValue(attr_name, { is_in: v });
    } else if(typeof v === "string" && v.endsWith("()")) {
      return this._attrHasAcceptableValue(attr_name, assert_value[v.replace("()","")]);
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
      } else if(typeof v === "string" || TypeChecker.isSimpleObject(v)) {
        for(let k in v)
          if(!assert_value[k](c.get(attr_name), string_to_array_or_object(v[k]))) return false;
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
        state_declaration = [condition_set, string_to_array_or_object(state_declaration[1])];
        // If display state has a parent, mix all the entities it has into the current
        // declaration entities list.
        if(parent != null) {
          state_declaration[0] = { ...parent[0], ...condition_set };
          state_declaration[1] = string_to_array_or_object(parent[1]).concat(state_declaration[1]);
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
