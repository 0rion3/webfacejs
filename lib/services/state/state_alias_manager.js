export class StateAliasManager {

  static get short_name() { return "alias" }

  constructor({states={}}={}) {
    this.states = this._expandAliases(states);
  }

  _expandAliases(state_aliases, { prefix=null, include_definition={}}={}) {
    var expanded_state_aliases = {};
    Object.keys(state_aliases).forEach((alias_name) => {
      let folded_state_aliases;
      let state_definition = state_aliases[alias_name];
      if(prefix) alias_name = `${prefix}/${alias_name}`;
      if(state_definition.constructor === Array) {
        expanded_state_aliases[alias_name] = state_definition[0];
        folded_state_aliases   = state_definition[1];
        state_definition       = { ...include_definition, ...state_definition[0] };
        expanded_state_aliases = {
          ...expanded_state_aliases,
          ...this._expandAliases(folded_state_aliases, { prefix: `${alias_name}`, include_definition: state_definition })
        };
      } else {
        expanded_state_aliases[alias_name] = { ...include_definition, ...state_definition };
      }
    }, this);
    return expanded_state_aliases;
  }

}
