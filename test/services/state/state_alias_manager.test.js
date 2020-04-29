import StateAliasManager from '../../lib/services/state/state_alias_manager.js';

describe("StateAliasManager", function() {

  it("expands state aliases hierarchy into a flat structure", function() {
    var state_aliases = {
      "State alias 1": { attr1: "value2" },
      "State alias 2": [{ attr2: ["value3", "value4"]}, {
        "Sub state alias A": { attr3: "value3" }
      }]
    };

    var state_aliases_manager = new StateAliasManager({ states: state_aliases });

    chai.expect(state_aliases_manager.states).to.deep.eq({
      "State alias 1": { attr1: "value2" },
      "State alias 2": { attr2: ["value3", "value4"] },
      "State alias 2/Sub state alias A": { attr2: ["value3", "value4"], attr3: "value3" }
    });
  });

});
