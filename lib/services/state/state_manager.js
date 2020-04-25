import { string_to_array_or_object } from "../../utils/string_helpers.js";
import { TypeChecker               } from "../../utils/type_checker.js";
import PublicPromise                 from "../../utils/public_promise.js";
import * as array_utils              from "../../utils/array_utils.js"
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
    this.component     = component;
    this.alias_manager = alias_manager;

    let default_settings = { multiple_definitions_exclusivity: true };
    this.settings        = { ...default_settings, ...settings };
    this.states          = this._expandFoldedStates(states);
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
        matches.push([Object.keys(state_definition), state_transition]);
    }
    var transitions = this._pickTransitionsFromMatches(matches);
    this.out_transitions_for_current_state = transitions.out;
    return transitions;
  }

  applyTransitions({ transitions=this.pickTransitionsForState().in, external_promise=null}={}) {
    var transition_promise = new PublicPromise(); // Resolves or rejects when transition is either completed or discarded.

    if(external_promise)
      external_promise.then(() => this.applyTransitionNow(transitions, transition_promise));
    else
      this.applyTransitionNow(transitions, transition_promise);

    return transition_promise;
  }

  applyTransitionNow() {
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

    var all_attr_names        = matches.map(m => m[0]);
    var resulting_transitions = { in: [], out: [], run_before: [], run_after: [] };

    function sortTransitionsToInOut(transitions, { include=true }={}) {
      if(!(transitions["in"] || transitions["out"]))
        transitions = { in: transitions, out: null, run_before: [], run_after: [] }
      if(include) {
        resulting_transitions.in  = resulting_transitions.in.concat(transitions.in);
        resulting_transitions.out = resulting_transitions.out.concat(transitions.out);

      if(transitions.run_before)
        resulting_transitions.run_before = resulting_transitions.run_before.concat(transitions.run_before);
      if(transitions.run_after)
        resulting_transitions.run_after = resulting_transitions.run_after.concat(transitions.run_after);
      }
    }

    if(this.settings.multiple_definitions_exclusivity) {

      matches.forEach((m) => {
        let attr_names  = m[0];
        let transitions = m[1];
        let include     = true;

        all_attr_names.forEach(attr_names2 => {
          if(attr_names.length < attr_names2.length && attr_names.every(elem => attr_names2.indexOf(elem) > -1)) {
            include = false;
            return;
          }
        });

        sortTransitionsToInOut(transitions, { include: include });
      });

    } else {
      matches.forEach(m => sortTransitionsToInOut(m[1]));
    }

    for(let k in resulting_transitions) {
      resulting_transitions[k] = array_utils.uniq(resulting_transitions[k]);
    }

    return {
      in: [...new Set(resulting_transitions.in)], out: [...new Set(resulting_transitions.out)],
      run_before: resulting_transitions.run_before, run_after: resulting_transitions.run_after
    };
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
