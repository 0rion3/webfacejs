import { extend_as }           from '../lib/utils/mixin.js'
import { I18n }                from '../lib/i18n.js'
import { Attributable }        from '../lib/modules/attributable.js'
import { DisplayStateManager } from '../lib/modules/display_state_manager.js'

class DummyComponent extends extend_as("DummyComponent").mixins(Attributable) {

  constructor() {
    super();
    this.attribute_names = ["attr1", "attr2", "attr3", "attr4"];
    this.children = [chai.spy.interface("childComponentMock", ["behave"])];

    this.display_state_manager_settings = { default_state_action: "show", multiple_attr_conditons_exclusivity: true }
    this.display_states = {
      attr1: [
        // First array item is attr1 value, which triggers the state.
        // Second array item are a list of entities to be shown (while all others become are hidden):
        //    * Items that start with # are role names for child components
        //    * Items that start with . are component part names
        //    * All other items are treated as both role names and part names
        ["value0", ["role_or_part_name1", "#role_name1", ".part_name1"]],
        // Simpler notation where the second array item is not an array, but a String, which
        // will be automatically parsed into an array by DisplayStateManager.
        ["value1", "role_or_part_name1, #role_name1, .part_name1"],
        ["value2", "role_or_part_name2, #role_name2, .part_name2"],
        // A more complex conditon where two different values of attr1 may trigger the same display state
        [["value3", "value4"], "role_or_part_name3, #role_name3, .part_name3"],
        // An even more complex condition where a state is triggered by when attr1 changes value from "value4" to "value5"
        [{ from: "value5", to: "value6" }, "role_or_part_name6, #role_name6, .part_name6"],
        // Or combine multiple to and from values:
        [{ from: "value4,value5", to: "value6,value7" }, "role_or_part_name7, #role_name7, .part_name7"],
      ],
      // You can specify two or more attributes to hold particular values in order for a display state
      // to be triggered:
      _custom_name_for_multiple_attr_condition: [
        [{ attr1: "value1", attr2: "value1" },                                ["M_role_or_part_name1", "#M_role_name1", ".M_part_name1"]],
        [{ attr1: "value2", attr2: "value1,value2" },                         ["M_role_or_part_name2", "#M_role_name2", ".M_part_name2"]],
        [{ attr1: { from: "value2", to: "value3" }, attr2: "value2,value3" }, ["M_role_or_part_name3", "#M_role_name3", ".M_part_name3"]],
        [{ attr1: "value1", attr4: "value4" },                                ["M_role_or_part_name4", "#M_role_name4", ".M_part_name4"]],
      ]
    }

    this.display_state_manager = new DisplayStateManager(this);
  }


  findPart(p) {
    if(p.includes("part")) return document.createElement('div');
    else return null;
  }
  findChildrenByRole(r) {
    if(r.includes("role")) return this.children;
    else                   return [];
  }
  behave(b) {}

}

var component;

describe('DisplayStateManager', function() {

  var c, ds;

  beforeEach(function() {
     c = new DummyComponent();
     ds = c.display_state_manager;
     chai.spy.on(c, "findChildrenByRole");
     chai.spy.on(c, "behave");
  });

  it("extracts all entity names from Comonent.display_states property into a flat array, removing duplicates", function() {
    chai.expect(ds.entities).to.deep.eq([
      "role_or_part_name1", "#role_name1", ".part_name1",
      "role_or_part_name2", "#role_name2", ".part_name2",
      "role_or_part_name3", "#role_name3", ".part_name3",
      "role_or_part_name6", "#role_name6", ".part_name6",
      "role_or_part_name7", "#role_name7", ".part_name7",
      "M_role_or_part_name1", "#M_role_name1", ".M_part_name1",
      "M_role_or_part_name2", "#M_role_name2", ".M_part_name2",
      "M_role_or_part_name3", "#M_role_name3", ".M_part_name3",
      "M_role_or_part_name4", "#M_role_name4", ".M_part_name4",
    ]);
  });

  it("expands single atttribute condition into a multiple attribute condition", function() {
    chai.expect(ds._expandSingleAttributeCondition("attr1", "value1,value2")).to.deep.equal({ attr1: "value1,value2" });
  });

  it("expands value part of the condition into a to-from object", function() {
    chai.expect(ds._expandToValueIntoFromTo("value1,value2")).to.deep.eq({ to: "value1,value2" });
  });

  it("calls correct method on Component to find entity of the appropriate type", function() {
    ds.findEntity("#role");
    chai.expect(c.findChildrenByRole).to.have.been.called.once;
    chai.expect(ds.findEntity(".part")).to.eq("part");
    chai.expect(ds.findEntity("part")).to.equal("part");
  });

  describe("picking entities for various states", function() {

    it("picks entity for based on 1 attribute value", function() {
      c.set("attr1", "value1");
      chai.expect(ds.pickEntitiesForState()).to.deep.eq(["role_or_part_name1", "#role_name1", ".part_name1"]);
    });

    it("picks entities based on a codition for multiple attribute values, not including entities from 1 attribute state", function() {
      c.set("attr1", "value1");
      c.set("attr2", "value1");
      chai.expect(ds.pickEntitiesForState()).to.deep.eq(["M_role_or_part_name1", "#M_role_name1", ".M_part_name1"]);
    });

    it("picks entities for both 1 attribute state and multiple attribute state when multiple_attr_conditons_exclusivity flag is true", function() {
      c.set("attr1", "value1");
      c.set("attr2", "value1");
      ds.settings.multiple_attr_conditons_exclusivity = false;
      chai.expect(ds.pickEntitiesForState()).to.deep.equal([
        "role_or_part_name1", "#role_name1", ".part_name1", "M_role_or_part_name1", "#M_role_name1", ".M_part_name1"
      ]);
    });

    it("includes entities from various states if their attribute list is different", function() {
      c.updateAttributes({ attr1: "value1", attr2: "value1", attr4: "value4" });
      chai.expect(ds.pickEntitiesForState()).to.deep.equal([
        "M_role_or_part_name1", "#M_role_name1", ".M_part_name1", "M_role_or_part_name4", "#M_role_name4", ".M_part_name4"
      ]);
    });

    it("includes entities for states where attribute value old value is checked", function() {
      c.set("attr1", "value5");
      c.set("attr1", "value6");
      chai.expect(ds.pickEntitiesForState()).to.deep.eq([
        "role_or_part_name6", "#role_name6", ".part_name6", "role_or_part_name7", "#role_name7", ".part_name7"
      ]);
      c.set("attr1", "value4");
      c.set("attr1", "value7");
      chai.expect(ds.pickEntitiesForState()).to.deep.eq(["role_or_part_name7", "#role_name7", ".part_name7"]);
      c.set("attr1", "value2");
      c.set("attr1", "value3");
      c.set("attr2", "value3");
      chai.expect(ds.pickEntitiesForState()).to.deep.eq(["M_role_or_part_name3", "#M_role_name3", ".M_part_name3"]);
    });

  });

  describe("calling actions on entities (to show or hide them)", function() {

    beforeEach(function() {
      c.set("attr1", "value1");
      ds.applyChanges();
    });

    it("applies hide action to all entities except the ones that are to be shown with the correct animation speed setting", function() {
      chai.expect(c.behave).to.not.have.been.called.with("hidePart", "part_name1", 500);
      //chai.expect(c.behave).to.have.been.called.exactly(19);
    });

    it("applies show action to all entities with the correct animation speed settings", function() {
      chai.expect(c.behave).to.have.been.called.with("showPart", "part_name1", 500);
    });

  });

});
