import { extend_as           } from '../../lib/utils/mixin.js';
import { Attributable        } from '../../lib/modules/attributable.js';
import { StateAliasManager   } from '../../lib/services/state/state_alias_manager.js';
import { DisplayStateManager } from '../../lib/services/state/display_state_manager.js';
import { StateActionManager  } from '../../lib/services/state/state_action_manager.js';
import { StateDispatcher     } from '../../lib/services/state/state_dispatcher.js';
import PublicPromise           from '../../lib/utils/public_promise.js';
import { any, is_null, not_null, is_in, not_in } from '../../lib/utils/standart_assertions.js';

class DummyComponent extends extend_as("DummyComponent").mixins(Attributable) {

  constructor() {
    super();

    this.states = [

      // Aliases go first
      {"Alias 1": { attr2: "value2", attr3: "value3" }},

      "actions", {},
        ["Alias 1", "transition_action_for_alias_1"], { before: "display" },

      "display", { hide_animation_speed: null, show_anitmation_speed: null },
        [{ attr1: "value1" }, ["role_or_part_name1", "#role_name1", ".part_name1"]],
        [{ attr1: "value2" }, "role_or_part_name2, #role_name2, .part_name2"],
        [{ attr1: "value3" }, "role_or_part_name3"],
        ["Alias 1", "role_or_part_name4"],

    ];

    this.attribute_names = ["attr1", "attr2", "attr3", "attr4", "attr5", "attr6", "attr7", "attr8", "attr9"];
    this.children = [chai.spy.interface("childComponentMock", ["behave"])];

    this.event_handlers   = chai.spy.interface('eventHandlerMapMock', ["add"]);
    this.state_dispatcher = new StateDispatcher(this);

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
    chai.expect(sd.sorted_states[0][1]).to.deep.eq({"Alias 1": { attr2: "value2", attr3: "value3" }});
    chai.expect(sd.sorted_states[1][0]).to.eq(StateActionManager);
    chai.expect(sd.sorted_states[1][1]).to.deep.eq([["Alias 1", "transition_action_for_alias_1"]]);
    chai.expect(sd.sorted_states[2][0]).to.equal(DisplayStateManager);
    chai.expect(sd.sorted_states[2][1]).deep.eq([
      [{ attr1: "value1" }, ["role_or_part_name1", "#role_name1", ".part_name1"]],
      [{ attr1: "value2" }, "role_or_part_name2, #role_name2, .part_name2"],
      [{ attr1: "value3" }, "role_or_part_name3"],
      ["Alias 1", "role_or_part_name4"]
    ]);
  });

  it("keeps record of states which transitions need to be run before or after some other state manager transition", function() {
    chai.expect(sd.before_after_instructions).to.deep.eq({ action: [
      { before: "display", state_description: "Alias 1" }
    ]});
  });

  it("applies transitions by different state managers consequently", function() {
    
  });

  it("rearranges the order in which state managers apply their transitions when before/after instructions are provided", function() {
    
  });

});
