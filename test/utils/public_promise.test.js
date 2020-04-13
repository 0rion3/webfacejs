import '../webface_init.js'
import PublicPromise from '../lib/utils/public_promise.js'

describe("PublicPromise", async function() {

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

  it("has a stores the result (resolved or rejected) in the status property", async function() {
    var promise;
    promise = new PublicPromise();
    promise.resolve(1);
    await promise.promise;
    chai.expect(promise.status).to.equal("resolved");
    chai.expect(promise.resolved).to.be.true;
    chai.expect(promise.result).to.eq(1);

    promise = new PublicPromise();
    promise.reject(2);
    await (promise.promise).catch(() => {});
    promise.catch(() => {
      chai.expect(promise.status).to.equal("rejected");
      chai.expect(promise.rejected).to.be.true;
      chai.expect(promise.result).to.be.eq(2);
    });
  });

});
