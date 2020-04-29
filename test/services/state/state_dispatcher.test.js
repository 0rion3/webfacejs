import extend_as           from '../../lib/utils/mixin.js';
import Attributable        from '../../lib/modules/attributable.js';
import StateAliasManager   from '../../lib/services/state/state_alias_manager.js';
import DisplayStateManager from '../../lib/services/state/display_state_manager.js';
import StateActionManager  from '../../lib/services/state/state_action_manager.js';
import StateDispatcher     from '../../lib/services/state/state_dispatcher.js';
import LinkedHashMap       from '../../lib/utils/linked_hash_map.js';
import PublicPromise       from '../../lib/utils/public_promise.js';
import assert              from '../../lib/utils/standart_assertions.js';


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

    this.states = [

      // Aliases go first
      {
        "Alias 1": { attr2: "value2", attr3: "value3" },
        "Alias 2": { "role1.attr1": "value1", "role2.attr2": "value2" }
      },

      "action", {},
        ["Alias 1", { in: "transition_action_for_alias_1", run_before: "display" }],

      "display", { hide_animation_speed: null, show_anitmation_speed: null },
        [{ attr1: "value1" }, ["role_or_part_name1", "#role_name1", ".part_name1"]],
        [{ attr1: "value2" }, "role_or_part_name2, #role_name2, .part_name2"],
        [{ attr1: "value3" }, "role_or_part_name3"],
        ["Alias 1", "role_or_part_name4"]

    ];

    this.attribute_names  = ["attr1", "attr2", "attr3", "attr4", "attr5", "attr6", "attr7", "attr8", "attr9"];
    this.children = [chai.spy.interface("childComponentMock", ["behave"]), new DummyChildComponent()];
    this.event_handlers   = chai.spy.interface('eventHandlerMapMock', ["add"]);
    this.state_dispatcher = new StateDispatcher(this);

  }

  findChildrenByRole(r) {
    if(r.includes("role")) return this.children;
    else                   return [];
  }
  findFirstChildByRole(r) {
    return this.findChildrenByRole(r)[1]; // Always return the second one, that's the one we care about
  }

}

describe("StateDispatcher", function() {

  var c, sd;

  beforeEach(function() {
    c = new DummyComponent();
    sd = c.state_dispatcher;
  });

  it("sorts component.states property, arranges states by managers their assigned to", function() {
    chai.expect(sd.sorted_states[0][0]).to.eq(StateAliasManager);
    chai.expect(sd.sorted_states[0][1]).to.deep.eq({
      "Alias 1": { attr2: "value2", attr3: "value3" },
      "Alias 2": { "role1.attr1": "value1", "role2.attr2": "value2" }
    });
    chai.expect(sd.sorted_states[1][0]).to.eq(StateActionManager);
    chai.expect(sd.sorted_states[1][1]).to.deep.eq([["Alias 1", { in: "transition_action_for_alias_1", run_before: "display" }]]);
    chai.expect(sd.sorted_states[2][0]).to.equal(DisplayStateManager);
    chai.expect(sd.sorted_states[2][1]).deep.eq([
      [{ attr1: "value1" }, ["role_or_part_name1", "#role_name1", ".part_name1"]],
      [{ attr1: "value2" }, "role_or_part_name2, #role_name2, .part_name2"],
      [{ attr1: "value3" }, "role_or_part_name3"],
      ["Alias 1", "role_or_part_name4"]
    ]);
  });

  it("extracts all children names and their attributes", function() {
    chai.expect(sd.children_roles_and_attrs).to.deep.eq({ role1: ["attr1"], role2: ["attr2"] });
  });

  it("subscribes component to relevant child component 'change' events when attr name contains a dot(.)", function() {
    sd.children_roles_and_attrs = { role1: ["attr1", "attr2"], role2: ["attr3", "attr4"] }
    sd._subscribeComponentToChildrenChanges();
    chai.expect(c.findFirstChildByRole("role12").publish_changes_for).to.deep.eq(["attr1", "attr2", "attr3", "attr4"]);
  });

  it("applies transitions by different state managers consequently", async function() {
    var result = "";
    var sa = sd.state_managers.get("action");
    var ds = sd.state_managers.get("display");
    sa.applyTransitions = ({ transitions=sa.pickTransitionsForState() }) => {
      result += "1.action;";
      return new Promise(resolve => resolve());
    }
    ds.applyTransitions = ({ transitions=ds.pickTransitionsForState()}={}) => {
        result += "2.display;";
      return new Promise(resolve => resolve());
    }
    await sd.applyTransitions();
    chai.expect(result).to.equal("1.action;2.display;");

    result = "";
    ds.pickTransitionsForState = function() { return { in: "transition", run_before: ["action"] }}
    await sd.applyTransitions();
    chai.expect(result).to.equal("2.display;1.action;");
  });

  it("rearranges the order in which state managers apply their transitions when before/after instructions are provided", function() {
    var state_managers_and_picked_transitions = [
      ["display", {}],
      ["action",  { run_before: ["display"]          }],
      ["custom",  { run_before: ["action", "display"]}]
    ];

    var result = sd._sortStateManagersByBeforeAfter(state_managers_and_picked_transitions).map(i => i[0]);
    chai.expect(result).to.deep.eq([
      "custom", "action", "display"
    ]);

    var state_managers_and_picked_transitions = [
      ["display", {}],
      ["action",  { run_before: ["custom"] }],
      ["custom",  { run_before: ["display"]}]
    ];

    result = sd._sortStateManagersByBeforeAfter(state_managers_and_picked_transitions).map(i => i[0]);
    chai.expect(result).to.deep.eq([
      "action", "custom", "display"
    ]);

    var state_managers_and_picked_transitions = [
      ["display", {}],
      ["custom",  { run_after:  ["display"] }],
      ["action",  { run_before: ["display"] }]
    ];

    result = sd._sortStateManagersByBeforeAfter(state_managers_and_picked_transitions).map(i => i[0]);
    chai.expect(result).to.deep.eq([
      "action", "display",  "custom"
    ]);

    var state_managers_and_picked_transitions = [
      ["custom",  { run_after:  ["display"] }],
      ["display", {}],
      ["action",  { run_before: ["display"] }]
    ];

    result = sd._sortStateManagersByBeforeAfter(state_managers_and_picked_transitions).map(i => i[0]);
    chai.expect(result).to.deep.eq([
      "action", "display",  "custom"
    ]);

  });

});
