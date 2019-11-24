import { merge_maps }                from "../utils/map_utils.js";
import { string_to_array_or_object } from "../utils/string_helpers.js";
import { TypeChecker }               from "../utils/type_checker.js";
import * as assert_value             from '../utils/standart_assertions.js';

export class DisplayStateManager {

  constructor(c) {
    let default_settings = { default_state_action: "show", hide_animation_speed: 500, show_animation_speed: 500, multiple_attr_conditons_exclusivity: true }
    this.settings        = { ...default_settings, ...c.display_state_manager_settings }
    this.component       = c;
    this.entities        = this._extractDisplayStateEntities();
    this.lock            = false;

    if(this.settings.default_state_clear_action == null) {
      if(this.settings.default_state_action == "hide")
        this.settings.default_state_clear_action = "show";
      else
        this.settings.default_state_clear_action = "hide";
    }
  }

  applyChanges() {
    if(this.lock)
      return false;
    else {
      let entities_for_state_action = this.pickEntitiesForState();
      this.applyAction(this.settings.default_state_clear_action, this.entities.filter(e => !entities_for_state_action.includes(e) ));
      this.applyAction(this.settings.default_state_action, entities_for_state_action);
    }
  }

  applyAction(action, entities) {
    entities.forEach(entity_name => {
      let entity = this.findEntity(entity_name);
      if(typeof entity === "string")
        this.component.behave(`${action}Part`, entity, this.settings[action + "_animation_speed"]);
      else
        entity.forEach(c => c.behave(action, this.settings[action + "_animation_speed"]));
    });
  }

  findEntity(name) {
    if(name[0] == "#") { // it's a role
      return this.component.findChildrenByRole(name.slice(1, name.length));
    } else if(name[0] == ".") { // it's a part
      if(this.component.findPart(name))
        return name.slice(1, name.length); // Returning string here, because we're going to use behave("hide/showPart"), which accepts a string.
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
    for(let declaration of this.component.display_states) {
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
    this.component.display_states.forEach(declaration => {
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
      } else {
        for(let k in v)
          if(!assert_value[k](this.component.get(attr_name), string_to_array_or_object(v[k]))) return false;
        return true;
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
