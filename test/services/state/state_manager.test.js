import extend_as         from '../../lib/utils/mixin.js'
import Attributable      from '../../lib/modules/attributable.js'
import StateManager      from '../../lib/services/state/state_manager.js'
import StateAliasManager from '../../lib/services/state/state_alias_manager.js'
import assert            from '../../lib/utils/standart_assertions.js'
import PublicPromise     from '../../lib/utils/public_promise.js'

class DummyChildComponent extends extend_as("ChildDummyComponent").mixins(Attributable) {
  constructor() {
    super();
    this.roles               = "role1";
    this.attribute_names     = ["attr1"];
    this.publish_changes_for = [];
  }
}

class DummyComponent extends extend_as("DummyComponent").mixins(Attributable) {

  constructor() {
    super();
    this.attribute_names = ["attr1", "attr2", "attr3", "attr4", "attr5", "attr6", "attr7", "attr8", "attr9"];
    this.children = [chai.spy.interface("childComponentMock", ["behave"]), new DummyChildComponent()];
    this.event_handlers = chai.spy.interface('eventHandlerMapMock', ["add"]);
  }

  findChildrenByRole(r) {
    if(r.includes("role")) return this.children;
    else                   return [];
  }
  findFirstChildByRole(r) {
    return this.findChildrenByRole(r)[1]; // Always return the second one, that's the one we care about
  }

}

describe("StateManager", function() {

  var c, sm;

  beforeEach(function() {
    c = new DummyComponent();
  });

  describe("syntax sugar", function() {

    beforeEach(function() {
      sm = new StateManager({ component: c });
    });

    it("expands folded states into a flat structure with multiple display state declarations", function() {
      // notice different styles of transition declaration - both strings separated by commas and arrays work.
      var folded_states = [
        [{ attr7: true }, "transition1", [
          [{ attr8: true }, "transition2", [
            // Checking that .part_name_folding_l1_a will be removed as duplicate
            [{ attr9: true}, "transition3"]
          ]]
        ]]
      ];

      chai.expect(sm._expandFoldedStates(folded_states)).to.deep.eq([
        [{ attr7: true }, ["transition1"]],
        [{ attr7: true, attr8: true }, ["transition1", "transition2"]],
        [{ attr7: true, attr8: true, attr9: true }, ["transition1", "transition2", "transition3"]]
      ]);
    });

    it("expands declarations with definition sets into multiple state declarations", function() {
      // The OR condition is expressed by using Array containng multiple Objects with key/values representing
      // attr_name and value condition as usual.
      var state_with_definition_set = [
        [
          { attr7: "a", attr8: "b"  },
          { attr8: "c", attr9: "d" },
          { attr7: "z", attr8: "z", attr9: "z" }
        ], "transition1", "folded state stub"
      ];

      // Notice how "transition1" isn't wrapper in an array! That's because
      // we didn't call _expandFoldedStates().
      chai.expect(sm._expandDefinitionSet(state_with_definition_set)).to.deep.eq([
        [{ attr7: "a", attr8: "b" },             "transition1", "folded state stub"],
        [{ attr8: "c", attr9: "d" },             "transition1", "folded state stub"],
        [{ attr7: "z", attr8: "z", attr9: "z" }, "transition1", "folded state stub"]
      ]);

    });

    it("handles folded states with definition set states", function() {

      var folded_states_with_condition_sets = [
        [[{ attr7: true }, { attr10: 1, attr11: 1 }], "transition1", [
          [{ attr8: true }, "transition2", [
            // Checking that transition2 is removed as duplicate
            [{ attr9: true }, "transition2"]
          ]]
        ]]
      ];

      var result = sm._expandFoldedStates(folded_states_with_condition_sets);

      chai.expect(result).to.deep.eq([
        [{ attr7: true }, ["transition1"]],
        [{ attr7: true, attr8: true }, ["transition1", "transition2"]],
        [{ attr7: true, attr8: true, attr9: true }, ["transition1", "transition2"]],
        [{ attr10: 1, attr11: 1 }, ["transition1"]],
        [{ attr10: 1, attr11: 1, attr8: true }, ["transition1", "transition2"]],
        [{ attr10: 1, attr11: 1, attr8: true, attr9: true }, ["transition1", "transition2"]]
      ]);
    });


    it("replaces state aliases with a set of attrs+values", function() {

      var state_aliases = {
        "State alias 1": { attr1: "value2" },
        "State alias 2": { attr2: ["value3", "value4"]},
        "State alias 3": { attr3: "value3" }
      };
      sm.alias_manager = new StateAliasManager({ states: state_aliases });

      var states = [
        ["State alias 1", "state_1_part1,state_1_part2"],
        ["State alias 2", "state_2_part1,state_2_part2"],
        ["State alias 2 + State alias 3", "state_2_part1,state_2_part2"],
      ];
      chai.expect(sm._expandFoldedStates(states)).to.deep.eq([
        [{ attr1: "value2" }, ["state_1_part1", "state_1_part2"]],
        [{ attr2: ["value3", "value4"] }, ["state_2_part1", "state_2_part2"]],
        [{ attr2: ["value3", "value4"], attr3: "value3" }, ["state_2_part1","state_2_part2"]]
      ]);
    });

  });

  describe("picking transitions for various states", function() {

    beforeEach(function() {
      var states = [
        [{ attr1: "value0" },                                                  "transition1"],
        [{ attr1: "value1" },                                                  "transition2"],
        [{ attr1: "value2" },                                                  "transition3"],
        [{ attr1: ["value3", "value4"]},                                       "transition4"],
        [{ old_attr1: "value5", attr1: "value6" },                             { in: "transition5", out: "out_transition5"}],
        [{ old_attr1: "value4,value5", attr1: "value6,value7" },               "transition6"],
        [{ attr1: "value1", attr2: "value1" },                                 "transition7"],
        [{ attr1: "value2", attr2: "value1,value2" },                          "transition8"],
        [{ old_attr1: "value2", attr1: "value3", attr2: "value2,value3" },     "transition9"],
        [{ attr1: "value1", attr4: "value4" },                                 "transition10"],
        [{ attr5: { is_in: "hello,world" }, attr6: { not_in: "hello,world" }}, "transition11"],
        [{ attr5: assert.not_null, attr6: assert.is_null                    }, "transition12"],
        [{ attr5: "is_null()", attr6: "not_null()"                          }, "transition13"],
        [{ attr5: true, attr6: 1                                            }, "transition14"],
        [{ "role1.attr1": "is_null()", attr1: "see child" },                   "transition15"],
        [{ "role1.attr1": true,        attr1: "see child" },                   "transition16"],
        [{ attr1: "in_out_transitions" },     { in: "in_transition",  out: "out_transition",  run_before: "display" }],
        [{ attr1: "in_out_transitions2" },    { in: "in_transition2",                         run_before: "display" }],
        [{ attr2: "run_before_transitions" }, { in: "in_transition",                          run_before: "custom_state_manager" }]
      ];
      sm = new StateManager({ component: c, states: states });
    });

    describe("concatenating and subtracting states", function() {

      var states1, states2;

      beforeEach(function() {
        states1 = [
          [{ attr1: "value1", attr2: ["value2", "value3"]},  "transition1"]
        ];
        states2 = [
          [{ attr2: ["value2", "value3"], attr1: "value1"},  "transition1"], // <-- This one shall not be included
          [{ attr1: "value1", attr3: "value3"},              "transition2"],
          [{ attr1: "value1", attr2: ["value2", "value4"]},  "transition3"]
        ];
      });

      it("concatenates states removing duplicates", function() {
        var resulting_states = [
          [{ attr1: "value1", attr3: "value3"},              "transition2"],
          [{ attr1: "value1", attr2: ["value2", "value4"]},  "transition3"],
          [{ attr1: "value1", attr2: ["value2", "value3"]},  "transition1"]
        ];
        chai.expect(sm._concatStates(states1, states2)).to.deep.eq(resulting_states);
      });

      it("subtracts states", function() {
        var result_of_states2_minus_states1 = [
          [{ attr1: "value1", attr3: "value3"},              "transition2"],
          [{ attr1: "value1", attr2: ["value2", "value4"]},  "transition3"]
        ];
        chai.expect(sm._subtractStates(states2, states1)).to.deep.eq(result_of_states2_minus_states1);
        chai.expect(sm._subtractStates(states1, states2)).to.be.empty;
      });

    });

    it("picks a transition based on 1 attribute value", function() {
      c.set("attr1", "value1");
      chai.expect(sm.pickTransitionsForState().in).to.deep.eq(["transition2"]);
    });

    // Default, pick_states_with_longest_definition_only is set to true
    it("picks a transition for both 1 attribute state and multiple attribute state when pick_states_with_longest_definition_only flag is true", function() {
      c.set("attr1", "value1");
      c.set("attr2", "value1");
      chai.expect(sm.pickTransitionsForState().in).to.deep.equal(["transition7"]);
    });

    // Non-standard behavior, pick_states_with_longest_definition_only is set to false
    it("picks picks a transition based on a definition with multiple attribute values, not including transitions from 1 attribute state, when pick_states_with_longest_definition_only flag is false", function() {
      c.set("attr1", "value1");
      c.set("attr2", "value1");
      sm.settings.pick_states_with_longest_definition_only = false;
      chai.expect(sm.pickTransitionsForState().in).to.deep.eq(["transition2", "transition7"]);
    });

    it("picks transitions from various states if their attribute list is different", function() {
      c.updateAttributes({ attr1: "value1", attr2: "value1", attr4: "value4" });
      chai.expect(sm.pickTransitionsForState().in).to.deep.equal(["transition7", "transition10"]);
    });

    it("picks transitions for states where attribute's old value is checked", function() {
      c.set("attr1", "value5");
      c.set("attr1", "value6");
      chai.expect(sm.pickTransitionsForState().in).to.deep.eq(["transition5", "transition6"]);
      c.set("attr1", "value4");
      c.set("attr1", "value7");
      var transitions = sm.pickTransitionsForState();
      chai.expect(transitions.in).to.deep.eq([]);
      chai.expect(transitions.out).to.deep.eq(["out_transition5"]);
      c.set("attr1", "value2");
      c.set("attr1", "value3");
      c.set("attr2", "value3");
      chai.expect(sm.pickTransitionsForState().in).to.deep.eq(["transition9"]);
    });

    it("picks transition for the value of the attribute on the first child with a particular role that was found", function() {
      c.set("attr1", "see child")
      c.findFirstChildByRole("role1").set("attr1", null);
      chai.expect(sm.pickTransitionsForState().in).to.deep.eq(["transition15"]);
      c.findFirstChildByRole("role1").set("attr1", true);
      chai.expect(sm.pickTransitionsForState().in).to.deep.eq(["transition16"]);
    });

    it("picks in/out transitions and moves out transitions for the previous state under 'previous_out' key in the returned object", function() {
      var transitions;
      c.set("attr1", "in_out_transitions");
      transitions = sm.pickTransitionsForState();
      chai.expect(transitions.in).to.deep.eq(["in_transition"]);
      chai.expect(transitions.out).to.deep.eq([]);
      sm._updateCurrentStates();

      c.set("attr1", "in_out_transitions2");
      transitions = sm.pickTransitionsForState();
      chai.expect(transitions.in).to.deep.eq(["in_transition2"]);
      chai.expect(transitions.out).to.deep.eq(["out_transition"]);
    });

    it("pick before or after which state managers it should run", function() {
      c.updateAttributes({ attr1: "in_out_transitions", attr2: "run_before_transitions" });
      chai.expect(sm.pickTransitionsForState().run_before).to.deep.eq(["display", "custom_state_manager"]);
    });

    describe("using type checks", function() {

      it("includes transitions for which the attribute value is present/not present within an array of acceptable values", function() {
        c.set("attr5", "hello");
        c.set("attr6", "bye");
        chai.expect(sm.pickTransitionsForState().in).to.deep.eq(["transition11"]);
        c.set("attr6", "hello");
        chai.expect(sm.pickTransitionsForState().in).to.be.empty;
      });

      it("includes transitions for which the attribute is null/not null", function() {
        c.set("attr5", "some value");
        c.set("attr6", null);
        chai.expect(sm.pickTransitionsForState().in).to.deep.eq(["transition12"]);
        c.set("attr6", "hello");
        chai.expect(sm.pickTransitionsForState().in).to.be.empty;
      });

      it("allows to specify type checking functions as strings", function() {
        c.set("attr5", null);
        c.set("attr6", "some value");
        chai.expect(sm.pickTransitionsForState().in).to.deep.eq(["transition13"]);
        c.set("attr5", "some value");
        chai.expect(sm.pickTransitionsForState().in).to.be.empty;
      });

      it("handles non-string values correctly", function() {
        c.set("attr5", true);
        c.set("attr6", 1);
        chai.expect(sm.pickTransitionsForState().in).to.deep.eq(["transition14"]);
      });

    });

  });

  describe("applying transitions", function() {

    var spy, applied_transitions;

    var states = [
      [{ attr1: "value1"}, { in: "in_transition1", out: "out_transition1"}],
      [{ attr1: "value2"}, { in: "in_transition2" }],
      [{ attr2: "value3"}, { in: "in_transition3" }]
    ];

    beforeEach(function() {
      sm = new StateManager({ component: c, states: states });
      applied_transitions = [];
      sm.applyTransitionsNow = (transitions) => {
        applied_transitions.push(transitions);
        return new Promise(resolve => resolve());
      }
      spy = chai.spy.on(sm, "applyTransitionsNow");
    });

    it("applies in transitions to states we're entering, but not the ones we're already in", async function() {
      c.set("attr1", "value1");
      await sm.applyTransitions();
      await sm.applyTransitions();
      chai.expect(applied_transitions).to.deep.eq([["in_transition1"]]);
    });

    it("applies out transitions to states we're exiting, but not the ones we've already exited", async function() {
      c.set("attr1", "value1");
      await sm.applyTransitions();
      c.set("attr1", "value2");
      await sm.applyTransitions();
      c.set("attr1", "value2");
      await sm.applyTransitions();
      c.set("attr2", "value3");
      chai.expect(applied_transitions).to.deep.eq([["in_transition1"], ["out_transition1"], ["in_transition2"]]);
    });

    it("applies 'out' transitions first, only when they finish, applies 'in' transitions", async function() {
      var result = "";
      sm.applyTransitionsNow = (transitions) => {
        result += transitions + ";";
        return new Promise(resolve => resolve());
      }

      c.set("attr1", "value1");
      await sm.applyTransitions();
      c.set("attr1", "value2");
      await sm.applyTransitions();
      chai.expect(result).to.equal("in_transition1;out_transition1;in_transition2;");
    });

  });

});
