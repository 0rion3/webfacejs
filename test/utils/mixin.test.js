import { extend_as } from '../lib/utils/mixin.js'
import { TypeChecker } from '../lib/utils/type_checker.js'

const Mixin1 = (Mixin1) => class extends Mixin1 {}
const Mixin2 = (Mixin2) => class extends extend_as("Mixin2").mixins(Mixin1) {}
const Mixin3 = (Mixin3) => class extends Mixin3 {}
const Mixin4 = (Mixin4) => class extends Mixin4 {}

class MyClass  extends extend_as("MyClass").mixins(Mixin2) {}
class MyClass2 extends extend_as("MyClass2").mix(MyClass).with(Mixin2, Mixin3) {}
class MyClass3 {}

// See tests in test/utils/type_checker.test.js as they cover this util very well for now.
