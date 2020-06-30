import StateAliasManager from '../../lib/services/state/state_alias_manager.js'

describe("StateAliasManager", function() {

  var states = {
    "Alias 1": { attr1: "value1", attr2: "value2" },
    "Alias 2": { attr1: "value2" },
    "Alias 3": [{ attr3: ["value2", "value3"]}, { attr4: "value4" }],
    "Alias 4": [{ attr5: ["value5", "value6"]}, { attr6: "value7" }]
  }
  var alias_manager;

  beforeEach(function() {
    alias_manager = new StateAliasManager({ states: states });
  });

  it("returns state definition for a given alias", function() {
    chai.expect(alias_manager.get("Alias 1")).to.deep.eq(
      { attr1: "value1", attr2: "value2" }
    );
    chai.expect(alias_manager.get("Alias 2")).to.deep.eq(
      { attr1: "value2" }
    );
    chai.expect(alias_manager.get("Alias 3")).to.deep.eq(
      [{ attr3: ["value2", "value3"]}, { attr4: "value4" }]
    );
  });

  it("combines state definitions of two aliases", function() {
    chai.expect(alias_manager.get("Alias 1 + Alias 2")).to.deep.eq(
      { attr1: "value2", attr2: "value2" }
    );

    chai.expect(alias_manager.get("Alias 2 + Alias 3")).to.deep.eq([
      { attr1: "value2", attr3: ["value2", "value3"]},
      { attr1: "value2", attr4: "value4" }
    ]);

    chai.expect(alias_manager.get("Alias 2 + Alias 3 + Alias 4")).to.deep.eq([
      { attr1: "value2", attr3: ["value2", "value3"], attr5: ["value5", "value6"]},
      { attr1: "value2", attr3: ["value2", "value3"], attr6: "value7" },
      { attr1: "value2", attr4: "value4", attr5: ["value5", "value6"]},
      { attr1: "value2", attr4: "value4", attr6: "value7"}
    ]);
  });

});
