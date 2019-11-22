import { merge_maps }                from "../utils/map_utils.js";
import { arrays_match }              from "../utils/array_utils.js";
import { string_to_array_or_object } from "../utils/string_helpers.js";

export class DisplayStateManager {

  constructor(c) {
    let default_settings = { default_state_action: "hide", multiple_attr_conditons_exclusivity: true }
    this.settings        = { ...default_settings, ...c.display_state_manager_settings }
    this.component       = c;
    this.entities        = this._extractDisplayStateEntities();
    this.lock            = false;
  }

  _extractDisplayStateEntities() {
    var entities = [];
    Object.values(this.component.display_states).forEach((attr_conditions) => {
      attr_conditions.forEach((condition) => {
        entities = entities.concat(string_to_array_or_object(condition[1]));
      });
    });
    return [...new Set(entities)];
  }

  pickEntitiesForState() {
    var matches = [];
    for(let attr_name in this.component.display_states) {
      for(let state of this.component.display_states[attr_name]) {

        let state_definition = this._expandSingleAttributeCondition(attr_name, state[0]);
        let state_entities   = string_to_array_or_object(state[1]);
        let has_match        = true; // default value, but will most likely be changed to false below.

        matches[state_definition] = [];
        for(let attr_name in state_definition) {
          let value_condition = this._expandToValueIntoFromTo(state_definition[attr_name]);
          let to_values       = string_to_array_or_object(value_condition.to);
          let from_values     = string_to_array_or_object(value_condition.from);

          if(!to_values.includes(this.component.get(attr_name)) ||
          (from_values !== undefined && !from_values.includes(this.component.get(`_old_${attr_name}`)))) {
            has_match = false;
            break;
          }
        }

        if(has_match)
          matches.push([Object.keys(state_definition), state_entities]);
      }
    }
    return this._pickEntitiesFromMatches(matches);
  }

  invokeActionForEntities(entities, action) {
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
          if(attr_names.length < attr_names2.length)
            include = attr_names2.every(elem => attr_names.indexOf(elem) > -1);
          if(!include) return;
        });

        if(include) resulting_entities = resulting_entities.concat(entities);

      });

    } else {
      matches.forEach(m => resulting_entities = resulting_entities.concat(m[1]));
    }
    return [...new Set(resulting_entities)];
  }

  _expandSingleAttributeCondition(attr_name, condition) {
    var attrs = {};
    if(attr_name.match(/^_/)) attrs            = condition;
    else                      attrs[attr_name] = condition;
    return attrs;
  }

  _expandToValueIntoFromTo(v) {
    if(typeof v === "string" || v.constructor === Array)
      return { to: v }
    else
      return v;
  }

}
