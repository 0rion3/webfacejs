import { extend_as }           from '../lib/utils/mixin.js'
import { I18n }                from '../lib/i18n.js'
import { Attributable }        from '../lib/modules/attributable.js'
import { Heritable }           from '../lib/modules/heritable.js'
import { Validatable }         from '../lib/modules/validatable.js'
import { Publisher   }         from '../lib/modules/observable_roles/publisher.js'
import { ComponentValidation, NoChildForValidations } from '../lib/modules/component_validation.js'

class DummyComponent extends extend_as("ComponentDomClass").mixins(Validatable, Heritable, ComponentValidation, Publisher, Attributable) {

  constructor() {
    super();
    // init I18n. It's done in the Component class, but we don't use it here
    // for minimilist purposes and to isolate this test better.
    this.i18n = new I18n();
    var json_data = '{ "validations" : { "attr1" : "field 1 validation message" }}'
    var body = `<div id='i18n_data_holder' data-i18n-json='${json_data}\'></div>`
    var doc = new DOMParser().parseFromString(body, "text/xml");
    this.i18n.loadData(doc);

    this.attribute_names = ["attr1", "attr2", "validation_errors_summary"];

    this.validations = {
      "attr1"        : { "isMoreThan": { "value": 1, "i18n_message": "DummyComponent.attr1" }, "allow_null" : true },
      "attr2"        : { "isMoreThan": 1, "allow_null" : true },
      "role2.attr2" :  { "isMoreThan": 1, "allow_null" : true },
      "role3.attr3" :  { "isMoreThan": 1, "allow_null" : true }
    }
  }

  t(key, component_name) { return this.i18n.t(key); }
  behave() {}

}

class DummyChildComponent extends extend_as("DummyChildComponent").mixins(Validatable, Heritable, ComponentValidation, Publisher, Attributable) {
  constructor() {
    super();
    this.validations = {};
    this.attribute_names = ["attr2", "attr3"];
  }
  behave() {}
}

var component;

describe('ComponentValidation', function() {

  beforeEach(function() {
     component = new DummyComponent();
  });

  it("translates the validation message", function() {
    component._i18nize_validation_messages();
    chai.expect(component.validations["attr1"]["isMoreThan"]["message"]).to.equal("field 1 validation message");
  });

  it("separates descendant validations from the rest", function() {
    component.separateDescendantValidations();
    chai.expect(Object.keys(component.validations)).to.include("attr1");
    chai.expect(Object.keys(component.validations)).to.not.include("role2.attr2");
  });

  it("runs validations on itself", function() {
    component.set("attr1", 1);
    component.set("attr2", 1);
    component.validate();
    chai.expect(component.valid).to.be.false;
  });

  it("fills #validation_errors_summary with all error messages", function() {
    component.set("attr1", 1);
    component.set("attr2", 1);
    component._i18nize_validation_messages();
    component.validate();
    chai.expect(component.get("validation_errors_summary")).to.equal("field 1 validation message, should be more than 1");
  });

  it("calls invokes 'hideErrors' or 'showErrors' behavior after validations are completed", function() {
    var spy = chai.spy.on(component, 'behave');

    component.set("attr1", 1);
    component.validate();
    chai.expect(spy).to.have.been.called.with('showErrors');

    component.set("attr1", 2);
    component.validate();
    chai.expect(spy).to.have.been.called.with('hideErrors');
  });

  describe("with children", function() {

    var child2;
    var child3;

    beforeEach(function() {
      child2 = new DummyChildComponent();
      child3 = new DummyChildComponent();
      child2.roles.push("role2");
      child3.roles.push("role3");
      component.children.push(child2);
      component.separateDescendantValidations()
    });

    it("adds validations to the child component if the role fits", function() {

      component.addValidationsToChild(child2);
      chai.expect(Object.keys(child2.validations)).to.include("attr2");

      chai.expect(function() { component.addValidationsToChild(child3); }).to.throw(NoChildForValidations);
      chai.expect(Object.keys(child3.validations)).to.not.include("role3.attr3");
    });

    it("adds descendant validations from its parent on initialization", function() {
      child2.parent = component;
      child2.afterInitialize();
      chai.expect(Object.keys(child2.validations)).to.include("attr2");
    });

    it("runs validations on its children", function() {
      component.children.push(child3);
      component.addValidationsToChild(child2);
      component.addValidationsToChild(child3);
      child2.set('attr2', 1)
      child3.set('attr3', 1)
      component.validate();
      chai.expect(component.valid).to.be.false;
      chai.expect(child2.valid).to.be.false;
      chai.expect(child3.valid).to.be.false;
      child2.set('attr2', 2)
      child3.set('attr3', 2)
      component.validate();
      chai.expect(component.valid).to.be.true;
      chai.expect(child2.valid).to.be.true;
      chai.expect(child3.valid).to.be.true;
    });
    
  });

});
