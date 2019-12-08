import '../webface_init.js'
import { PositionManager } from '../lib/utils/position_manager.js'
import { fetch_dom       } from '../../test_utils.js'

describe("PositionManager", function() {

  var dom, pos, el;

  before(async function() {
    dom = (await fetch_dom("fixtures/position_manager.html")).querySelector("#root");
    el  = dom.querySelector("#positioned");
    pos = PositionManager;
  });

  beforeEach(function() {
    document.querySelector("body").appendChild(dom);
    dom.style.width  = "100px";
    dom.style.height = "100px";
    el.style.width   = "20px"
    el.style.height  = "10px"
  });

  after(function() {
    dom.remove();
    el.remove();
  });

  it("gets element relative position", function() {
    chai.expect(pos.getRelPosition(el, dom)).to.eql({ 'x' : 0, 'y' : 0 });
  });

  it("gets element dimensions", function() {
    chai.expect(pos.getDimensions(el)).to.eql({ 'x' : 20, 'y' : 10 });
  });

  it("places element at the correct position relative to its parent", function() {
    var dom_pos = dom.getBoundingClientRect();
    pos.placeAt(el, dom_pos.left+50, dom_pos.top+50);
    chai.expect(pos.getRelPosition(el, dom)).to.eql({ 'x' : 50, 'y' : 50 });
  });

  it("positions element inside its parent", function() {
    pos.placeBy(el, dom, { left: 0.5, top: 0.5, gravity_top: 0.5, gravity_left: 0.5 });
    chai.expect(pos.getRelPosition(el, dom)).to.eql({ 'x' : 40, 'y' : 45 });
  });

});
