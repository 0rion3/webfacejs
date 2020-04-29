import extend_as from '../lib/utils/mixin.js'
import Heritable from '../lib/modules/heritable.js'

class HeritableClass extends extend_as("HeritableClass").mixins(Heritable) {}

describe('Heritable', function() {

  var parent;
  var children_level_1 = [];
  var children_level_2 = [];
  var spy;

  beforeEach(function() {
    parent = new HeritableClass();
    for(var i=0; i < 5; i++) {
      children_level_1.push(new HeritableClass());
      children_level_1[i].id = `l1_child${i+1}`;
    }
    for(var i=0; i < 5; i++) {
      children_level_2.push(new HeritableClass());
      children_level_2[i].id = `l2_child${i+1}`;
    }
  });

  it("adds child and sets its parent to self", function() {
    parent.addChild(children_level_1[0]);
    chai.expect(parent.children).to.include(children_level_1[0]);
    chai.expect(parent.children[0].parent).to.equal(parent);
  });

  it("finds child by id", function() {
    parent.addChild(children_level_1[0]);
    parent.addChild(children_level_1[1]);
    chai.expect(parent.findChildById('l1_child1')).to.equal(children_level_1[0]);
  });

  it("returns undefined if child with such an id is not found", function() {
    parent.addChild(children_level_1[0]);
    chai.expect(parent.findChildById('non_existent_id')).to.be.undefined;
  });

  it("doesn't add the same child twice", function() {
    parent.addChild(children_level_1[0]);
    parent.addChild(children_level_1[0]);
    chai.expect(parent.children.length).to.equal(1);
  });

  it("removes the child by its id", function() {
    chai.expect(parent.children.length).to.equal(0);
    parent.addChild(children_level_1[0]);
    parent.addChild(children_level_1[1]);
    parent.removeChild('l1_child2');
    chai.expect(parent.children.length).to.equal(1);
  });

  it("removes the child when passed an object", function() {
    chai.expect(parent.children.length).to.equal(0);
    parent.addChild(children_level_1[0]);
    parent.addChild(children_level_1[1]);
    parent.removeChild(children_level_1[0]);
    chai.expect(parent.children.length).to.equal(1);
  });

  it("finds descendants by id", function() {
    for(var i=0; i < 5; i++) {
      parent.addChild(children_level_1[i]);
      parent.children[i].addChild(children_level_2[i]);
    }
    chai.expect(parent.findDescendantsById('l2_child1')[0]).to.equal(children_level_2[0]);
  });

  it("finds first descendant by id", function() {
    for(var i=0; i < 5; i++) {
      parent.addChild(children_level_1[i]);
      parent.children[i].addChild(children_level_2[i]);
    }
    chai.expect(parent.findDescendantById('l2_child1')).to.equal(children_level_2[0]);
  });

});
