import { extend_as }           from '../../lib/utils/mixin.js'
import { Attributable }        from '../../lib/modules/attributable.js'
import { StateActionManager }  from '../../lib/services/state/state_action_manager.js'
import PublicPromise           from '../../lib/utils/public_promise.js';

class DummyComponent extends extend_as("DummyComponent").mixins(Attributable) {

  constructor() {
    super();
    this.attribute_names = ["attr1", "attr2"];
  }

  transitionIntoState1()   {}
  transitionIntoState2a()  {}
  transitionIntoState2b()  {}
  transitionIntoState3()   {}
  transitionOutOfState3a() {}
  transitionOutOfState3b() {}

}

describe('StateActionManager', function() {

  var c, sa, states;

  beforeEach(function() {

    c = new DummyComponent();

    states = [
      [{ attr1: "value1", attr2: "value2" }, "transitionIntoState1" ],
      [{ attr1: "value2", attr2: "value3" }, ["transitionIntoState2a", "transitionIntoState2b" ]],
      [{ attr1: "in_out_state_value"      }, { in: "transitionIntoState3", out: ["transitionOutOfState3a", "transitionOutOfState3b"] }]
    ];

     sa = new StateActionManager({ component: c, states: states });
     chai.spy.on(c, "transitionIntoState1");
     chai.spy.on(c, "transitionIntoState2a");
     chai.spy.on(c, "transitionIntoState2b");
     chai.spy.on(c, "transitionIntoState3");
     chai.spy.on(c, "transitionOutOfState3a");
     chai.spy.on(c, "transitionOutOfState3b");
  });

  it("runs function as a transition into a state", async function() {
    c.updateAttributes({ attr1: "value1", attr2: "value2" });
    await sa.applyTransitions();
    chai.expect(c.transitionIntoState1).to.have.been.called.once;
  });

  it("runs multiple transitions into a state", async function() {
    c.updateAttributes({ attr1: "value2", attr2: "value3" });
    await sa.applyTransitions();
    chai.expect(c.transitionIntoState2a).to.have.been.called.once;
    chai.expect(c.transitionIntoState2b).to.have.been.called.once;
  });

  it("runs a both in/out transitions when on Object with in/out keys is provided", async function() {
    c.updateAttributes({ attr1: "in_out_state_value" });
    await sa.applyTransitions();
    c.updateAttributes({ attr1: "value1" });
    await sa.applyTransitions();
    chai.expect(c.transitionIntoState3).to.have.been.called.once;
    chai.expect(c.transitionOutOfState3a).to.have.been.called.once;
    chai.expect(c.transitionOutOfState3b).to.have.been.called.once;
  });

});
