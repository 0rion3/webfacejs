import '../webface_init.js'
import PublicPromise from '../lib/utils/public_promise.js'

describe("PublicPromise", function() {

  it("allows to call resolve from outside", function() {
    var promise = new PublicPromise();
    promise.resolve(1);
    promise.then((result) => chai.expect(result).to.equal(1));
  });

  it("allows to call catch from outside", function() {
    var promise = new PublicPromise();
    promise.reject(2);
    promise.catch((result) => chai.expect(result).to.equal(2));
  });

  it("allows to call finally from outside", function() {
    var finally_was_called = false;
    var promise = new PublicPromise();
    promise.finally(() => finally_was_called = true);
    promise.resolve(3);
    promise.then(() => chai.expect(finally_was_called).to.be.true);
  });

});
