import { merge_maps }                from "../utils/map_utils.js";
import { string_to_array_or_object } from "../utils/string_helpers.js";
import { TypeChecker }               from "../utils/type_checker.js";
import * as array_utils              from "../utils/array_utils.js"
import * as assert_value             from '../utils/standart_assertions.js';

export class DisplayStateManager {

  constructor(c) {
    let default_settings = { default_state_action: "show", hide_animation_speed: 500, show_animation_speed: 500, multiple_attr_conditons_exclusivity: true }
    this.settings        = { ...default_settings, ...c.display_state_manager_settings }
    this.component       = c;
    this.display_states  = this._expandFoldedStates(c.display_states);
    this.entities        = this._extractDisplayStateEntities();
    this.lock            = false;

    if(this.settings.default_state_clear_action == null) {
      if(this.settings.default_state_action == "hide")
        this.settings.default_state_clear_action = "show";
      else
        this.settings.default_state_clear_action = "hide";
    }

    // Apply the default "clear" action on initialization.
    // Usually it means hiding all parts and child components listed in this.component.display_states
    if(this.component.display_state_apply_clear_state_on_init)
      this.applyClearState();

  }

  applyChanges() {
    if(this.lock)
      return false;
    else {
      let entities_for_state_action = this.pickEntitiesForState();
      this.last_state_change = [
        this.entities.filter(e => !entities_for_state_action.includes(e)),
        entities_for_state_action
      ];
      this._applyLatestChanges();
    }
  }

  applyAction(action, entities, { animation_speed=null }={}) {
    if(animation_speed == null)
      animation_speed = this.settings[action + "_animation_speed"];
    let promise;
    entities.forEach(entity_name => {
      let entity = this.findEntity(entity_name);
      if(typeof entity === "string")
        promise = this.component.behave(`${action}Part`, [entity, animation_speed]);
      else if(entity != null)
        promise = entity.forEach(c => c.behave(action, [animation_speed]));
    });
    return promise;
  }

  async applyClearState() {
    await this.applyAction(this.settings.default_state_clear_action, this.entities, { animation_speed: 1 });
  }

  findEntity(name) {
    if(name[0] == "#") { // it's a role
      return this.component.findChildrenByRole(name.slice(1, name.length));
    } else if(name[0] == ".") { // it's a part
      let part_name = name.slice(1, name.length);
      if(this.component.findPart(part_name))
        return part_name; // Returning string here, because we're going to use behave("hide/showPart"), which accepts a string.
    } else { // we don't know
      let part = this.findEntity("." + name);
      if(part == null)
        return this.findEntity("#" + name);
      else
        return part;
    }
  }

  pickEntitiesForState() {
    var matches = [];
    for(let declaration of this.display_states) {
      let state_definition      = declaration[0];
      let state_entities        = string_to_array_or_object(declaration[1]);
      let has_match             = true;

      for(let attr_name in state_definition) {
        if(!this._attrHasAcceptableValue(attr_name, state_definition[attr_name])) {
          has_match = false;
          break;
        }
      }
      if(has_match)
        matches.push([Object.keys(state_definition), state_entities]);
    }
    return this._pickEntitiesFromMatches(matches);
  }

  _extractDisplayStateEntities() {
    var entities = [];
    this.display_states.forEach(declaration => {
      entities = entities.concat(string_to_array_or_object(declaration[1]));
    });
    return [...new Set(entities)];
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
      if(attr_name.match(/^old_/)) attr_name = attr_name.replace("old_", "_old_");

      if(TypeChecker.isFunction(v)) {
        return v(this.component.get(attr_name));
      } else if(typeof v === "string" || TypeChecker.isSimpleObject(v)) {
        for(let k in v)
          if(!assert_value[k](this.component.get(attr_name), string_to_array_or_object(v[k]))) return false;
        return true;
      } else {
        return v === this.component.get(attr_name);
      }
    }
  }

  // Takes all the matches, checks their specificity and decides which ones
  // to include. Examples of how it works:
  //
  // "attr1" and "attr2" states both match - we include both of their entities in the resulting list.
  // "attr1" and "attr1, attr2" match - we only include "attr1, attr2" entities in the resulting list.
  // "attr1, attr2" and "attr1, attr2, attr3" match - we only include "attr1, attr2, attr3" entities in the resulting list.
  // "attr1, attr2" and "attr2, attr3" match, we include both of their entitites in the resulting list.
  _pickEntitiesFromMatches(matches) {
    var all_attr_names = matches.map(m => m[0]);
    var resulting_entities = [];
    if(this.settings.multiple_attr_conditons_exclusivity) {

      matches.forEach((m) => {
        let attr_names = m[0];
        let entities   = m[1];
        let include    = true;

        all_attr_names.forEach(attr_names2 => {
          if(attr_names.length < attr_names2.length && attr_names.every(elem => attr_names2.indexOf(elem) > -1)) {
            include = false;
            return;
          }
        });

        if(include) resulting_entities = resulting_entities.concat(entities);

      });

    } else {
      matches.forEach(m => resulting_entities = resulting_entities.concat(m[1]));
    }
    return [...new Set(resulting_entities)];
  }

  /* The purpose of this method is to always attempt to apply the latest changes, ignoring
   * all the previous changes whose line in the queue may not have yet come. In fact, there's no queue.
   *
   * Say there are 3 state changes: (a) is already being animated, (b) is sitting waiting its turn in
   * `this.last_state_change` property and (c) was just initiated and applyChanges() just called for it.
   * In this case (b) will be comletely ingored, as applyChanges() will rewrite `this.last_state_change`
   * and put (c) into it. Therefore, after the animation for (a) is completed, DisplayStateManager will get
   * straight to executing (c) animations. This is because there's no point in animating (b) because the state
   * had already changed since then.
   */
  async _applyLatestChanges() {
    if(this.queue_lock) return;
    this.queue_lock = true;
    while(this.last_state_change != null) {
      // We're only interested in applying the latest changes, while disregarding all others:
      let display_state      = this.last_state_change;
      this.last_state_change = null;

      // this.applyChanges() may be called from various places in the code almost simulataneously, resulting
      // in screen animation blinking overload due to constantly changing states. To avoid this problem, we always await
      // until the previous animation completes, only then we proceed with the new one.
      await Promise.all([
        this.applyAction(this.settings.default_state_clear_action, display_state[0]),
        this.applyAction(this.settings.default_state_action, display_state[1])
      ]);
    }
    this.queue_lock = false;
  }

  _expandSingleAttributeCondition(attr_name, condition) {
    var attrs = {};
    if(attr_name.match(/^_/)) attrs            = condition;
    else                      attrs[attr_name] = condition;
    return attrs;
  }

  _expandFoldedStates(display_states, parent=null) {
    var expanded_display_states = [];

    display_states.forEach(ds => {

      // Before we expand folded states, we must first take care of
      // the codition sets and expand those into separate diplay states.
      this._expandConditionSet(ds).forEach((ds_from_set) => {
        let folded_states = ds_from_set[2];
        ds_from_set = [ds_from_set[0], string_to_array_or_object(ds_from_set[1])];
        // If display state has a parent, mix all the entities it into the current
        // declaration entities list.
        if(parent != null) {
          ds_from_set[0] = { ...parent[0], ...ds_from_set[0] };
          ds_from_set[1] = string_to_array_or_object(parent[1]).concat(ds_from_set[1]);
          ds_from_set[1] = array_utils.uniq(ds_from_set[1]);
        }

        expanded_display_states.push(ds_from_set);

        if(folded_states) { // declaration Array has a third element, means it has folded states
          expanded_display_states = expanded_display_states.concat(this._expandFoldedStates(folded_states, ds_from_set));
        }
      }, this);
    }, this);

    return expanded_display_states;

  }

  _expandConditionSet(ds) {

    var display_states_with_expanded_condition_sets = [];

    if(ds[0].constructor === Array) {
      ds[0].forEach(condition_set => {
        let new_ds = [condition_set, ds[1], ds[2]];
        display_states_with_expanded_condition_sets.push(new_ds);
      });
    } else {
      display_states_with_expanded_condition_sets.push(ds);
    }

    return display_states_with_expanded_condition_sets;
  }

}
