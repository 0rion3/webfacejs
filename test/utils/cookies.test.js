import '../webface_init.js'
import { Cookies } from '../lib/utils/cookies.js'

describe("cookies", function() {

  it("sets, gets and removes a cookie", function() {
     Cookies.set("cookie1", "1");
     Cookies.set("cookie2", "2");
     chai.expect(Cookies.get("cookie1")).to.equal("1");
     chai.expect(Cookies.get("cookie2")).to.equal("2");
     Cookies.delete("cookie1")
     chai.expect(Cookies.get("cookie1")).to.equal(null);
     chai.expect(Cookies.get("cookie2")).to.equal("2");
  });

});
