import { extend_as }           from '../../lib/utils/mixin.js'
import { I18n }                from '../../lib/utils/i18n.js'
import { Attributable }        from '../../lib/modules/attributable.js'
import { Publisher }           from '../../lib/modules/observable_roles/publisher.js'
import { DisplayStateManager } from '../../lib/services/state/display_state_manager.js'
import { any, is_null, not_null, is_in, not_in } from '../../lib/utils/standart_assertions.js';
import PublicPromise           from '../../lib/utils/public_promise.js';

class DummyChildComponent extends extend_as("ChildDummyComponent").mixins(Attributable,Publisher) {
  constructor() {
    super();
    this.roles                  = "role1";
    this.attribute_names        = ["attr1"];
    this.publish_changes_for    = ["change"];
    this.state_manager_settings = {};
  }
  behave() {}
}

class DummyComponent extends extend_as("DummyComponent").mixins(Attributable) {

  constructor() {
    super();
    this.attribute_names = ["attr1", "attr2", "attr3", "attr4", "attr5", "attr6", "attr7", "attr8", "attr9"];
    this.children = [chai.spy.interface("childComponentMock", ["behave"]), new DummyChildComponent()];

    this.display_states = [
      [{ attr1: "value1" }, ["role_or_part_name1", "#role_name1", ".part_name1"]],
      [{ attr1: "value2" }, "role_or_part_name2, #role_name2, .part_name2"],
      [{ attr1: "value3" }, "role_or_part_name3"],
    ];

    this.event_handlers = chai.spy.interface('eventHandlerMapMock', ["add"]);
  }


  findPart(p) {
    if(p.includes("part")) return document.createElement('div');
    else return null;
  }
  findChildrenByRole(r) {
    if(r.includes("role")) return this.children;
    else                   return [];
  }
  findFirstChildByRole(r) {
    return this.findChildrenByRole(r)[1]; // Always return the second one, that's the one we care about
  }
  behave(b) {}

}

describe('DisplayStateManager', function() {

  var c, ds;
  var ds_settings = {
    default_state_action: "show",
    multiple_attr_conditons_exclusivity: true,
    hide_animation_speed: null,
    show_anitmation_speed: null
  };

  beforeEach(function() {
     c = new DummyComponent();
     ds = new DisplayStateManager({ component: c, states: c.display_states, settings: ds_settings });
     chai.spy.on(c, "findChildrenByRole");
     chai.spy.on(c, "behave");
  });

  describe("entity lookup", function() {

    it("extracts all entity names from Comonent.display_states property into a flat array, removing duplicates", function() {
      chai.expect(ds.entities).to.deep.eq([
        "role_or_part_name1", "#role_name1", ".part_name1",
        "role_or_part_name2", "#role_name2", ".part_name2",
        "role_or_part_name3"
      ]);
    });

    it("calls correct method on Component to find entity of the appropriate type", function() {
      ds._findEntity("#role");
      chai.expect(c.findChildrenByRole).to.have.been.called.once;
      chai.expect(ds._findEntity(".part")).to.eq("part");
      chai.expect(ds._findEntity("part")).to.equal("part");
    });

  });


  describe("applying transitions to entities", function() {


    describe("hiding/showing entities", function() {

      it("applies hide or show behavior to a list of entities", function() {
        ds._applyBehaviorToEntities("hide", ["role1", "#role2", "part1", ".part2"]);
        chai.expect(c.behave).to.have.been.called.with("hidePart", ["part1", null]);
        chai.expect(c.behave).to.have.been.called.with("hidePart", ["part1", null]);
        chai.expect(c.children[0].behave).to.have.been.called.twice.with("hide");
      });

      it("passes hide and show behaviors the correct list of entities to hide and show", async function() {
        ds._applyBehaviorToEntities = () => {
          return new Promise(resolve => resolve());
        }
        chai.spy.on(ds, "_applyBehaviorToEntities");
        c.set("attr1", "value1");
        var promise = ds.applyTransitions();
        await promise;
        chai.expect(ds._applyBehaviorToEntities).to.have.been.called.with("hide",
          ["role_or_part_name2", "#role_name2", ".part_name2", "role_or_part_name3"]);
        chai.expect(ds._applyBehaviorToEntities).to.have.been.called.with("show",
          ["role_or_part_name1", "#role_name1", ".part_name1"]);
      });

    });

    describe("transition promise", function() {

      var behavior_promises, returned_promises;

      beforeEach(function() {
        behavior_promises = [];
        returned_promises = [];
        for(let i=0; i < 6; i += 1)
          behavior_promises.push(new PublicPromise());

        ds._applyBehaviorToEntities = () => {
          returned_promises.push(behavior_promises.pop());
          return returned_promises[returned_promises.length-1];
        }
      });

      it("resolves transition promise when all behaviors for the transition complete", async function() {
        c.set("attr1", "value1");
        var transitions = ds.pickTransitionsForState();
        var promise = ds.applyTransitionsNow(transitions.in);
        returned_promises[0].resolve();
        returned_promises[1].resolve();
        await promise;
        chai.expect(promise.resolved).to.be.true;
      });

      it("rejects transition promise when a transition is discarded from the queue", async function() {
        var promise, transitions;
        c.set("attr1", "value1");
        transitions = ds.pickTransitionsForState();
        promise = ds.applyTransitionsNow(transitions.in);
        c.set("attr1", "value2");
        transitions = ds.pickTransitionsForState();
        promise = ds.applyTransitionsNow(transitions.in);
        c.set("attr1", "value3");
        transitions = ds.pickTransitionsForState();
        promise = ds.applyTransitionsNow(transitions.in);
        var display_state_promises = ds.queue.map(item => item.transition_promise);
        returned_promises[0].resolve();
        returned_promises[1].resolve();
        for(let p of returned_promises.slice(0,2)) await p;
        returned_promises[2].resolve();
        returned_promises[3].resolve();
        for(let p of returned_promises.slice(2,4)) await p;
        chai.expect(display_state_promises[0].resolved).to.be.true;
        chai.expect(display_state_promises[1].rejected).to.be.true;
        chai.expect(display_state_promises[2].resolved).to.be.true;
      });

    });

  });

});
