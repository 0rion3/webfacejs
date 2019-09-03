import { TypeChecker } from '../lib/utils/type_checker.js'
import { extend_as }   from '../lib/utils/mixin.js'

const Mixin1a = (Mixin1a) => class extends Mixin1a {}
const Mixin1b = (Mixin1b) => class extends Mixin1b {}
const Mixin1  = (Mixin1)  => class extends extend_as("Mixin1").mixins(Mixin1a) {}
const Mixin2  = (Mixin2)  => class extends extend_as("Mixin2").mixins(Mixin1)  {}
const Mixin3  = (Mixin3)  => class extends Mixin3                              {}
const Mixin4  = (Mixin4)  => class extends Mixin4                              {}

class TC_MyClass  extends extend_as("TC_MyClass").mixins(Mixin2,Mixin1b) {}
class TC_MyClass2 extends extend_as("TC_MyClass2").mix(TC_MyClass).with(Mixin2, Mixin3) {}
class TC_MyClass3 {}
class TC_MyClass4 extends TC_MyClass {}

describe("TypeChecker", function() {
  
  it("identifies a simple object, discarding arrays, functions and instances of other classes", function() {
    chai.expect(TypeChecker.isSimpleObject({"hello" : "world"})).to.be.true
    chai.expect(TypeChecker.isSimpleObject(["hello", "world"])).to.be.false
    chai.expect(TypeChecker.isSimpleObject("hello world")).to.be.false
    chai.expect(TypeChecker.isSimpleObject(new TC_MyClass())).to.be.false
  });

  it("checks whether an object's class or its ancestor or one of the mixed in mixins have a mixin mixed-in", function() {
    var obj1 = new TC_MyClass();
    var obj2 = new TC_MyClass2();
    var obj3 = new TC_MyClass3();
    var obj4 = new TC_MyClass4();
    chai.expect(TypeChecker.hasMixin(obj2, Mixin1)).to.be.true;
    chai.expect(TypeChecker.hasMixin(obj2, Mixin2)).to.be.true;
    chai.expect(TypeChecker.hasMixin(obj2, Mixin1a)).to.be.true;
    chai.expect(TypeChecker.hasMixin(obj2, Mixin3)).to.be.true;
    chai.expect(TypeChecker.hasMixin(obj2, Mixin4)).to.be.false;
    chai.expect(TypeChecker.hasMixin(obj3, Mixin1)).to.be.false;
    chai.expect(TypeChecker.hasMixin(obj1, Mixin1b)).to.be.true;
    chai.expect(TypeChecker.hasMixin(obj4, Mixin1b)).to.be.true;
  });

});
