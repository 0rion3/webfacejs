import array_utils from  '../../utils/array_utils.js'

export default class StateAliasManager {

  static get short_name() { return "alias" }

  constructor({states={}}={}) {
    this.states = states;
  }

  get(alias) {
    if(alias.includes("+")) {
      let definitions = this._getDefinitionsForManyAliases(alias);
      let result = [];
      for(let def of definitions) {
        result = this._mergeTwoDefinitions(result, def);
      }
      return result.length == 1 ? result[0] : result;
    } else {
      return this.states[alias];
    }
  }

  _getDefinitionsForManyAliases(aliases) {
    let definitions = [];
    for(let a of aliases.split("+")) {
      let d = this.states[a.trim()];
      if(d != null) {
        if(!(d instanceof Array)) d = [d];
        definitions.push(d);
      }
    }
    definitions = array_utils.uniq(definitions);
    return definitions;
  }

  _mergeTwoDefinitions(def1, def2) {
    if(def1.length == 0)
      return def2;
    else if(def2.length == 0)
      return def1;

    var result = [];
    for(let set_def1 of def1) {
      for(let set_def2 of def2) {
        result.push({ ...set_def1, ...set_def2 });
      }
    }
    result = array_utils.uniq(result);
    return result;
  }

}
