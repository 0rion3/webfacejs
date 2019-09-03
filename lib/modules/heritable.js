export const Heritable = (Heritable) => class extends Heritable {

  constructor() {
    super();
    this.children = [];
    this.parent   = null;
    this.id       = null;
  }

  addChild(child) {
    child.parent = this;
    if(!this.children.includes(child)) {
      this.children.push(child);
    }
  }

  findChildById(child_id) {
    return this.children.find(c => c.id == child_id);
  }

  removeChild(child) {
    var i;
    if(child instanceof String) // it's an ID
      i = this.children.findIndex(c => c.id == child);
    else // it's an actual object!
      i = this.children.findIndex(c => c == child);
    this.children.splice(i,1);
  }

  findDescendantsById(descendant_id) {
    var descendants = [];
    var d = this.findChildById(descendant_id);
    if(!(d === undefined))
      descendants.push(d);
    this.children.forEach(function(c) {
      c.findDescendantsById(descendant_id).forEach(function(d) {
        descendants.push(d);
      });
    });
    return descendants;
  }

  findDescendantById(descendant_id) {
    var descendant = this.findChildById(descendant_id);
    if(!(descendant === undefined))
      return descendant;
    this.children.find(c => !((descendant = c.findDescendantById(descendant_id)) === undefined))
    return descendant;
  }

}
