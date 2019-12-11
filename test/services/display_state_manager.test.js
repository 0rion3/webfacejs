import { extend_as }           from '../lib/utils/mixin.js'
import { I18n }                from '../lib/utils/i18n.js'
import { Attributable }        from '../lib/modules/attributable.js'
import { DisplayStateManager } from '../lib/services/display_state_manager.js'
import { any, is_null, not_null, is_in, not_in } from '../lib/utils/standart_assertions.js';

class DummyComponent extends extend_as("DummyComponent").mixins(Attributable) {

  constructor() {
    super();
    this.attribute_names = ["attr1", "attr2", "attr3", "attr4", "attr5", "attr6", "attr7", "attr8", "attr9"];
    this.children = [chai.spy.interface("childComponentMock", ["behave"])];

    this.display_state_manager_settings = { default_state_action: "show", multiple_attr_conditons_exclusivity: true }
    this.display_states = [
      [{ attr1: "value0" }, ["role_or_part_name1", "#role_name1", ".part_name1"]],
      [{ attr1: "value1" }, "role_or_part_name1, #role_name1, .part_name1"],
      [{ attr1: "value2" }, "role_or_part_name2, #role_name2, .part_name2"],
      [{ attr1: ["value3", "value4"]}, "role_or_part_name3, #role_name3, .part_name3"],
      [{ old_attr1: "value5", attr1: "value6" }, "role_or_part_name6, #role_name6, .part_name6"],
      [{ old_attr1: "value4,value5", attr1: "value6,value7" }, "role_or_part_name7, #role_name7, .part_name7"],
      [{ attr1: "value1", attr2: "value1" },                             ["M_role_or_part_name1", "#M_role_name1", ".M_part_name1"]],
      [{ attr1: "value2", attr2: "value1,value2" },                      ["M_role_or_part_name2", "#M_role_name2", ".M_part_name2"]],
      [{ old_attr1: "value2", attr1: "value3", attr2: "value2,value3" }, ["M_role_or_part_name3", "#M_role_name3", ".M_part_name3"]],
      [{ attr1: "value1", attr4: "value4" },                             ["M_role_or_part_name4", "#M_role_name4", ".M_part_name4"]],

      [{ attr5: { is_in: "hello,world" }, attr6: { not_in: "hello,world" }}, ["hello", "world"]],
      [{ attr5: not_null, attr6: is_null                                  }, ["hello2", "world2"]],
      [{ attr5: "is_null()", attr6: "not_null()"                          }, ["hello3", "world3"]],
    ]

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
      "hello", "world", "hello2", "world2", "hello3", "world3",
    ]);
  });

  it("expands single atttribute condition into a multiple attribute condition", function() {
    chai.expect(ds._expandSingleAttributeCondition("attr1", "value1,value2")).to.deep.equal({ attr1: "value1,value2" });
  });

  it("expands folded states into a flat structure", function() {
    // notice different styles of entity declaration - both strings separated by commas and arrays work.
    var folded_states = [
      [{ attr7: true }, ".part_name_folding_l1_a,.part_name_folding_l1_b", [
        [{ attr8: true }, [".part_name_folding_l2_a", ".part_name_folding_l2_b"], [
          // Checking that .part_name_folding_l1_a will be removed as duplicate
          [{ attr9: true}, ".part_name_folding_l3_a,.part_name_folding_l3_b,.part_name_folding_l1_a"] 
        ]]
      ]]
    ];
    chai.expect(ds._expandFoldedStates(folded_states)).to.deep.eq([
      [{ attr7: true }, [".part_name_folding_l1_a", ".part_name_folding_l1_b"]],
      [{ attr7: true, attr8: true }, [".part_name_folding_l1_a", ".part_name_folding_l1_b", ".part_name_folding_l2_a", ".part_name_folding_l2_b"]],
      [{ attr7: true, attr8: true, attr9: true }, [".part_name_folding_l1_a", ".part_name_folding_l1_b", ".part_name_folding_l2_a", ".part_name_folding_l2_b", ".part_name_folding_l3_a", ".part_name_folding_l3_b"]]
    ]);
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

    it("includes entities for states where attribute's old value is checked", function() {
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


    describe("using type checks", function() {

      it("includes entities for which the attribute value is present/not present within an array of acceptable values", function() {
        c.set("attr5", "hello");
        c.set("attr6", "buy");
        chai.expect(ds.pickEntitiesForState()).to.deep.eq(["hello", "world"]);
        c.set("attr6", "hello");
        chai.expect(ds.pickEntitiesForState()).to.be.empty;
      });

      it("includes entities for which the attribute is null/not null", function() {
        c.set("attr5", "some value");
        c.set("attr6", null);
        chai.expect(ds.pickEntitiesForState()).to.deep.eq(["hello2", "world2"]);
        c.set("attr6", "hello");
        chai.expect(ds.pickEntitiesForState()).to.be.empty;
      });

      it("allows to specify type checking functions as strings", function() {
        c.set("attr5", null);
        c.set("attr6", "some value");
        chai.expect(ds.pickEntitiesForState()).to.deep.eq(["hello3", "world3"]);
        c.set("attr5", "some value");
        chai.expect(ds.pickEntitiesForState()).to.be.empty;
      });

      it("handles non-string values correctly", function() {
         // TODO
      });

    });

  });

  describe("calling actions on entities (to show or hide them)", function() {

    beforeEach(function() {
      c.set("attr1", "value1");
      ds.applyChanges();
    });

    it("applies hide action to all entities except the ones that are to be shown with the correct animation speed setting", function() {
      chai.expect(c.behave).to.not.have.been.called.with("hidePart", ["part_name1", 500]);
    });

    it("applies show action to all entities with the correct animation speed settings", function() {
      chai.expect(c.behave).to.have.been.called.with("showPart", ["part_name1", 500]);
    });

  });

});
