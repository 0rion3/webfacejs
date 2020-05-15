import { fetch_dom } from '../test_utils.js'
import extend_as     from '../lib/utils/mixin.js'
import Attributable  from '../lib/modules/attributable.js'
import ComponentDom  from '../lib/modules/component_dom.js'

class ComponentDomClass extends extend_as("ComponentDomClass").mixins(ComponentDom,Attributable) {
  constructor() {
    super();
    this.attribute_names = ["attr1", "attr2", "attr3", "writeable_attr1", "writeable_attr2",
                            "writeable_attr3", "writeable_attr4", "writable_value",
                            "attr_without_html_attribute", "reversable_attr", "defined_attr",
                            "undefined_attr", "non_dom_attr"];
    this.non_dom_attribute_names = ["non_dom_attr"];
    this.attribute_casting = this.constructor.attribute_casting;
  }
}

var doc;
var dom;
var component_dom;
var spy;

describe('ComponentDom', function() {

  before(async function() {
    doc = (await fetch_dom("fixtures/component_dom.html"));
    dom = doc.querySelector('[data-component-class="RootComponent"]');
    ComponentDomClass.owner_document = doc;
    component_dom = new ComponentDomClass();
    component_dom.dom_element = dom;
  });

  it("finds all dom descendants and self by attr_name and attr_value", function() {
    chai.expect(component_dom.allDomDescendantsAndSelfWithAttr(dom, { attr_name: "attr", attr_value: "value1"})).have.lengthOf(1)
    chai.expect(component_dom.allDomDescendantsAndSelfWithAttr(dom, { attr_name: "attr", attr_value: "value2"})).have.lengthOf(2)
    chai.expect(component_dom.allDomDescendantsAndSelfWithAttr(dom, { attr_name: "attr", attr_value: "value3"})).have.lengthOf(1)
    chai.expect(component_dom.allDomDescendantsAndSelfWithAttr(dom, { attr_name: "attr", attr_value: "root_value"})).have.lengthOf(1)
    chai.expect(component_dom.allDomDescendantsAndSelfWithAttr(dom, { attr_name: "attr", attr_value: "non_existent_value"})).be.empty
  });

  it("finds first descendant or self by attr_name and attr_value", function() {
    chai.expect(component_dom.firstDomDescendantOrSelfWithAttr(dom, { attr_name: "attr", attr_value: "value1"})).be.instanceof(Element)
    chai.expect(component_dom.firstDomDescendantOrSelfWithAttr(dom, { attr_name: "attr", attr_value: "value2"})).be.instanceof(Element)
    chai.expect(component_dom.firstDomDescendantOrSelfWithAttr(dom, { attr_name: "attr", attr_value: "value3"})).be.instanceof(Element)
    chai.expect(component_dom.firstDomDescendantOrSelfWithAttr(dom, { attr_name: "attr", attr_value: "root_value"})).be.instanceof(Element)
    chai.expect(component_dom.firstDomDescendantOrSelfWithAttr(dom, { attr_name: "attr", attr_value: "non_existent_value"})).be.null
  });

  it("finds all parts of a component", function() {
    chai.expect(component_dom.findAllParts("part1")).to.have.lengthOf(1);
    chai.expect(component_dom.findAllParts("part2")).to.have.lengthOf(2);
    chai.expect(component_dom.findAllParts("part3")).to.have.lengthOf(1);
    chai.expect(component_dom.findAllParts("non_existent_part")).be.empty
  });

  it("finds the first part of a component it stumbles upon that matches the name", function() {
    chai.expect(component_dom.findPart("part1")).to.be.instanceof(Element);
    chai.expect(component_dom.findPart("part2")).to.be.instanceof(Element);
    chai.expect(component_dom.findPart("part3")).to.be.instanceof(Element);
    chai.expect(component_dom.findPart("non_existent_part")).be.null;
  });

  it("finds all descendants that are not components or descendants of a component included into the current node", function() {
    chai.expect(component_dom.allDomDescendants(dom).some((el) => el.getAttribute('data-component-class') != null)).to.be.false
  });

  it("finds ancestor elements with matching attributes", function() {
    chai.expect(component_dom.ancestorOrSelfWithAttr(dom)).to.equal(dom);
    chai.expect(component_dom.ancestorOrSelfWithAttr(dom, { attr_name: "attr", attr_value: "root_value" })).to.equal(dom);
    chai.expect(component_dom.ancestorOrSelfWithAttr(dom.children[0], { attr_name: "attr", attr_value: "root_value" })).to.equal(dom);

    var el = component_dom.firstDomDescendantOrSelfWithAttr(dom, { attr_name: "attr", attr_value: "value3"});
    chai.expect(component_dom.ancestorOrSelfWithAttr(el, { attr_name: "attr", attr_value: "root_value" })).to.equal(dom);
  });

  it("finds all attr elements for the component that match the name", function() {
    chai.expect(component_dom.findAttrElements("attr1")).to.have.lengthOf(3);
    chai.expect(component_dom.findAttrElements("attr2")).to.have.lengthOf(2);
    chai.expect(component_dom.findAttrElements("non_existent_attr")).be.empty;
  });

  it("finds first attr element that matches the name", function() {
    chai.expect(component_dom.findFirstAttrElement("attr1")).to.be.instanceof(Element)
    chai.expect(component_dom.findFirstAttrElement("attr2")).to.be.instanceof(Element)
    chai.expect(component_dom.findFirstAttrElement("non_existent_attr")).be.null;
  });

  it("gets html attribute name for a attr from data-component-attribute-names format", function() {
    component_dom.use_default_html_attrs_for_attrs = false;
    chai.expect(component_dom._getHtmlAttributeNameForAttr("attr1:data-attr1,attr2:data-attr2", "attr1")).to.equal("data-attr1")
    chai.expect(component_dom._getHtmlAttributeNameForAttr("attr1:data-attr1,attr2:data-attr2", "attr2")).to.equal("data-attr2")
    chai.expect(component_dom._getHtmlAttributeNameForAttr("attr1:data-attr1,attr2:data-attr2", "attr3")).to.be.null;
    component_dom.use_default_html_attrs_for_attrs = true;
    chai.expect(component_dom._getHtmlAttributeNameForAttr("attr1:data-attr1,attr2:data-attr2", "attr3")).to.equal("data-attr3")
  });

  it("casts string values extracted from DOM into appropriate types", function() {
    chai.expect(component_dom._castAttrFromDom("attr1", "true")).to.be.true
    chai.expect(component_dom._castAttrFromDom("attr1", "false")).to.be.false
    chai.expect(component_dom._castAttrFromDom("attr1", "1")).to.eq(1)
    chai.expect(component_dom._castAttrFromDom("attr1", "1.23")).to.eq(1.23)
    chai.expect(component_dom._castAttrFromDom("attr1", "")).to.eq(null)
    chai.expect(component_dom._castAttrFromDom("attr1", "  ")).to.eq(null)
  });

  it("casts attributes into strings before writing to DOM", function() {
    component_dom.set("attr1", true);
    chai.expect(component_dom._castAttrToDom("attr1")).to.eq("true")
    component_dom.set("attr1", false);
    chai.expect(component_dom._castAttrToDom("attr1")).to.eq("")
    component_dom.set("attr1", 1);
    chai.expect(component_dom._castAttrToDom("attr1")).to.eq("1")
    component_dom.set("attr1", 1.23);
    chai.expect(component_dom._castAttrToDom("attr1")).to.eq("1.23")
    component_dom.set("attr1", 0);
    chai.expect(component_dom._castAttrToDom("attr1")).to.eq("0")
  });

  it("uses custom casting function for a specific attribute", function() {
    let reverse_str = function(s) {
      let reversed = "";
      for (var i = s.length - 1; i >= 0; i--)
        reversed += s[i];
      return reversed;
    }
    component_dom.attribute_casting["to_dom"]["reversable_attr"]   = reverse_str;
    component_dom.attribute_casting["from_dom"]["reversable_attr"] = reverse_str;
    component_dom.set("reversable_attr", "abc");
    chai.expect(component_dom._castAttrToDom("reversable_attr")).to.eq("cba");
    chai.expect(component_dom._castAttrFromDom("reversable_attr", "cba")).to.eq("abc");
  });

  it("reads attr values from nodes and updates the corresponding attributes in the component", function() {
    chai.expect(component_dom._readAttrFromNode("attr1")).to.equal("value for attr 1 - a");
    chai.expect(component_dom._readAttrFromNode("attr2")).to.equal(1);
    chai.expect(component_dom._readAttrFromNode("attr3")).to.equal(1.23);
  });

  it("writes attribute value to the corresponding attr element textContent in the DOM", function() {

    var attr_el      = component_dom.firstDomDescendantOrSelfWithAttr(dom, { attr_name: "data-component-attr", attr_value: "writeable_attr1" });
    var attr_attr_el = component_dom.firstDomDescendantOrSelfWithAttr(dom, { attr_name: "data-writeable-attr2", attr_value: "null" });

    component_dom.set("writeable_attr1", "hello world");
    component_dom._writeAttrToNode("writeable_attr1");
    chai.expect(attr_el.textContent).to.equal("hello world");

    component_dom.set("writeable_attr1", 1);
    component_dom._writeAttrToNode("writeable_attr1");
    chai.expect(attr_el.textContent).to.equal("1");

    component_dom.set("writeable_attr1", 1.23);
    component_dom._writeAttrToNode("writeable_attr1");
    chai.expect(attr_el.textContent).to.equal("1.23");

    component_dom.set("writeable_attr2", "hello world 2");
    component_dom._writeAttrToNode("writeable_attr2");
    chai.expect(attr_attr_el.getAttribute("data-writeable-attr2")).to.equal("hello world 2");

    component_dom.set("attr_without_html_attribute", "hello world");
    component_dom._writeAttrToNode("attr_without_html_attribute");
    chai.expect(component_dom.dom_element.getAttribute("data-attr-without-html-attribute")).to.equal("hello world");
  });

  it("writes attribute value to the corresponding element mapped property", function() {
    var attr_el = component_dom.firstDomDescendantOrSelfWithAttr(dom, { attr_name: "data-component-attr-map", attr_value: "writable_value:value" });

    component_dom.set("writable_value", 0);
    component_dom._writeAttrToNode("writable_value");
    chai.expect(attr_el.value).to.equal("0");
  });

  it("doesn't read or write attributes if source value is undefined", function() {
    component_dom.set("defined_attr", undefined);
    chai.expect(component_dom.findFirstAttrElement("defined_attr").getAttribute("data-defined-attr")).to.equal("defined value");

    component_dom.attributes["undefined_attr"] = 1;
    component_dom._readAttrFromNode("undefined_attr");
    chai.expect(component_dom.get("undefined_attr")).to.eq(1);
  });

  it("writes attribute value to ALL attr elements in the DOM if there are many", function() {
    component_dom.set("writeable_attr4", "hello world");
    component_dom._writeAttrToNode("writeable_attr4");
    chai.expect(dom.querySelector("#writable_attr4_el1").textContent).to.equal("hello world");
    chai.expect(dom.querySelector("#writable_attr4_el2").textContent).to.equal("hello world");
    chai.expect(dom.querySelector("#writable_attr4_el3").getAttribute("data-attr4")).to.equal("hello world");
    chai.expect(dom.querySelector("#writable_attr4_el4").getAttribute("data-attr4")).to.equal("hello world");
  });

  it("finds whether the dom_element's descendants have a particular node or if it itself is this node", function() {
    chai.expect(component_dom._hasNode(component_dom.firstDomDescendantOrSelfWithAttr(dom, { attr_name: "data-component-attr", attr_value: "writeable_attr1" }))).to.be.true
    chai.expect(component_dom._hasNode(component_dom.firstDomDescendantOrSelfWithAttr(dom, { attr_name: "data-component-attr", attr_value: "non_existent_attr" }))).to.be.false
    chai.expect(component_dom._hasNode(component_dom.firstDomDescendantOrSelfWithAttr(dom, { attr_name: "attr", attr_value: "root_value" }))).to.be.true
  });

  it("updates attributes from nodes, skips some and invokes callbacks if needed", function() {
    // Updating all attributes
    component_dom.set("writeable_attr3", "new value");
    component_dom.updateAttrsFromNodes();
    chai.expect(component_dom.get("writeable_attr3")).to.equal("writeable_attr3 value");

    // Updating one attr
    component_dom.set("writeable_attr3", "new value");
    component_dom.updateAttrsFromNodes({ attributes: ["writeable_attr3" ]});
    chai.expect(component_dom.get("writeable_attr3")).to.equal("writeable_attr3 value");

    // invoking callback when updating a attr
    component_dom.attribute_callbacks["writeable_attr3"] = function(value, self) { }
    spy = chai.spy.on(component_dom.attribute_callbacks, "writeable_attr3");
    component_dom.set("writeable_attr3", "new value");
    component_dom.updateAttrsFromNodes({ attrs: ["writeable_attr3"]});
    chai.expect(spy).to.not.have.been.called;
    component_dom.updateAttrsFromNodes({ attrs: ["writeable_attr3"], run_callback: true });
    chai.expect(spy).to.have.been.called.with("writeable_attr3", component_dom);
  });

  it("removes element from the dom", function() {
    var component2 = new ComponentDomClass();
    component2.dom_element = component_dom.firstDomDescendantOrSelfWithAttr(dom, { attr_name: "class", attr_value: "RemovableComponent" });
    component2._removeDomElement();
    chai.expect(component_dom.firstDomDescendantOrSelfWithAttr(dom, { attr_name: "data-component-class", attr_value: "RemovableComponent" })).to.be.null;
  });

  it("finds the template element in the DOM", function() {
    component_dom._initTemplate();
    chai.expect(component_dom.template.outerHTML).to.equal('<div data-component-template="ComponentDomClass">ComponentDomClass template</div>');
  });

  it("appends child to the DOM element", function() {
    var new_element = component_dom.dom_element.ownerDocument.createElement('div');
    new_element.textContent = "new child element";
    component_dom._appendChildDomElement(new_element);
    chai.expect(Array.from(dom.children).slice(-1)[0].outerHTML).to.equal('<div>new child element</div>');
  });

  it("assigns roles from the dom_element", function() {
    component_dom._assignRolesFromDomElement();
    chai.expect(component_dom.roles).to.eql(["role1", "role2"]);
  });

  it("finds children dom elements that are to be assigned to nested components", function() {
    var child_components_els = component_dom._findChildComponentDomElements(dom);
    chai.expect(child_components_els[0].getAttribute("data-component-class")).to.equal("MyComponent");
    chai.expect(child_components_els[1].getAttribute("data-component-class")).to.equal("MyComponent2");
  });

  it("clones template and assigns it to #dom_element attr", function() {
    component_dom.initDomElementFromTemplate();
    chai.expect(component_dom.dom_element.textContent).to.equal("ComponentDomClass template");
  });

  describe("handling non-DOM attrubutes", function() {

    it("it doesn't attempt to read values from DOM with updateAttrsFromNodes()", function() {
      component_dom.set("non_dom_attr", "some value");
      component_dom.dom_element.setAttribute("data-non-dom-attr", "hello");
      component_dom.updateAttrsFromNodes(["non_dom_attr"]);
      chai.expect(component_dom.get("non_dom_attr")).to.equal("some value");
    });

    it("throws an error when attempting to read value from DOM with _readAttrFromNode()", function() {
      chai.expect(() => component_dom._readAttrFromNode("non_dom_attr")).to.throw;
    });

    it("throws an error when attempting to write value to DOM with _writeAttrFromNode()", function() {
      chai.expect(() => component_dom._writeAttrToNode("non_dom_attr", "some value")).to.throw;
    });

  });

});
