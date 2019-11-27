import { extend_as } from '../lib/utils/mixin.js'
import { Attributable, UndefinedAttributeError, NestedAttributeError } from '../lib/modules/attributable.js'

class Dummy extends extend_as("Dummy").mixins(Attributable) {
  constructor() {
    super();
    this.attribute_names = ["caption", "title", "attr3", "custom_getter_setter_attr"];
    this.default_attribute_values = { "attr3": "default_value",  "custom_getter_setter_attr" : "hello" };
  }

  _get_attr_custom_getter_setter_attr() {
    return this.attributes["custom_getter_setter_attr"] + "!";
  }

  _set_attr_custom_getter_setter_attr(value) {
    this.attributes["custom_getter_setter_attr"] = value + " (set)";
  }

}

describe('Attributable', function() {

  var dummy;
  var spy;

  beforeEach(function() {
    dummy = new Dummy();
    dummy.dummy2 = new Dummy();
  });

  it('returns an attribute value when a getter is called', function() {
    dummy.set("caption", "New Caption");
    chai.expect(dummy.get("caption")).to.equal("New Caption");
  });

  it('returns an attribute value when a getter is called', function() {
    chai.expect(function() { dummy.get("non_existent_attr") }).to.throw(UndefinedAttributeError);
    chai.expect(function() { dummy.set("non_existent_attr", "x")}).to.throw(UndefinedAttributeError);
  });

  it('invokes a default callback if no custom callback for the attribute is defined', function() {
    spy = chai.spy.on(dummy.attribute_callbacks, 'default');
    dummy.set("title", 'New Title');
    chai.expect(spy).to.have.been.called.with('title', dummy);
  });

  it('keeps previous value of the attribute', function() {
    dummy.set('title', 'Title 1');
    dummy.set('title', 'Title 2');
    chai.expect(dummy.get('title', 'old')).to.equal('Title 1');
    dummy.set('title', 'Title 3');
    chai.expect(dummy.get('title', 'old')).to.equal('Title 2');
  });

  it('tells if new value is different from the old one', function() {
    dummy.set('title', 'Title 1');
    dummy.set('title', 'Title 2');
    chai.expect(dummy.hasAttributeChanged("title")).to.be.true;
    dummy.set('title', 'Title 2');
    chai.expect(dummy.hasAttributeChanged("title")).to.be.false;
  });


  it('updates attributes in bulk', function() {
    dummy.updateAttributes({"title" : "New Title", "caption": "New Caption"});
    chai.expect(dummy.get("title")).to.equal("New Title");
    chai.expect(dummy.get("caption")).to.equal("New Caption");
  });

  it('while updating attributes in bulk, ignores those with a dot', function() {
    dummy.updateAttributes({"subcomponent.attr" : "new value"})
    // Doesn't throw UndefinedAttributeError
  });

  it("updates one attribute and throws an error if it doesn't exist", function() {
    dummy.updateAttribute("title", "New Title");
    chai.expect(dummy.get("title")).to.equal("New Title");
    chai.expect(function() { dummy.updateAttribute( 'non_existent_attr', 'new caption' )}).to.throw(UndefinedAttributeError);
  });

  it('runs callbacks on attributes after updating them in bulk', function() {
    dummy.attribute_callbacks["title"] = function() {}
    spy = chai.spy.on(dummy.attribute_callbacks, 'title');
    dummy.updateAttributes({"title" : "New Title"});
    chai.expect(spy).to.have.been.called.with('title', dummy);
  });

  it('doesn\'t run callbacks on attributes after updating them in bulk if closure evaluates to false', function() {
    dummy.attribute_callbacks["title"] = function() {}
    dummy.updateAttributes({ 'caption' : 'new caption' }, function() { return false; });
    chai.expect(spy).to.not.have.been.called.with('title', dummy);
  });

  it("sets default values for attributes", function() {
    dummy.setDefaultAttributeValues();
    chai.expect(dummy.get("attr3")).to.equal("default_value");
  });

  it("throws error if attribute doesn't exist and someone tries to update it with updateAttributes()", function() {
    chai.expect(function() { dummy.updateAttributes({ 'non_existent_attr' : 'new caption' })}).to.throw(UndefinedAttributeError);
  });

  it("doesn't throw error if attribute doesn't exist but `ingore_non_existent: true` is passed to updateAttributes()", function() {
    dummy.updateAttributes({ 'non_existent_attr' : 'new caption' }, { ignore_non_existent: true })
    // Doesn't throw UndefinedAttributeError
  });

  it("allows to redefine getters", function() {
    dummy.setDefaultAttributeValues();
    chai.expect(dummy.get("custom_getter_setter_attr")).to.equal("hello!");
  });

  it("allows to redefine setters", function() {
    dummy.set("custom_getter_setter_attr", "hello");
    chai.expect(dummy.get("custom_getter_setter_attr")).to.equal("hello (set)!");
  });

  it("updates attributes of a component in the associated property if the value for one of the keys is itself an object", function() {
    dummy.updateAttributes({ caption: "new caption", dummy2: { caption: "dummy2 new caption"}});
    chai.expect(dummy.get("caption")).to.equal("new caption");
    chai.expect(dummy.dummy2.get("caption")).to.equal("dummy2 new caption");
    chai.expect(function() { dummy.updateAttributes( { dummy3: { caption: "dummy3 new caption "}} )}).to.throw(NestedAttributeError);
  });

});
