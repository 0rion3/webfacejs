import '../webface_init.js'
import { AjaxRequest } from './lib/ajax_request.js'

describe("AjaxRequest", async function() {

  var url = `http://${window.location.hostname}:${window.location.port}/ajax_test`;

  it("makes a successful ajax request and returnes data to the handler", async function() {
    var result;
    await AjaxRequest.make(url, "POST", { params: { "hello" : "world" }}).then((data)=> result  = data);;
    // server basically responds with the same params
    chai.expect(result).to.eql({ "hello" : "world", "_method": 'POST' });
  });

  it("has a shortcut method for GET and POST ajax requests", async function() {
    var get_result, post_result;
    await AjaxRequest.get(url,  { "hello" : "world" }).then((data)=> get_result  = data);
    await AjaxRequest.post(url, { "hello" : "world" }).then((data)=> post_result  = data);
    chai.expect(get_result).to.eql({ "hello" : "world" });
    chai.expect(post_result).to.eql({ "hello" : "world", "_method": 'POST' });
  });

  it("has shortcut methods for PUT, PATCH and DELETE requests as accepted by Ruby On Rails", async function() {
    var put_result, patch_result, delete_result;
    await AjaxRequest.put(url,    { "hello" : "world" }).then((data)=> put_result  = data);
    await AjaxRequest.patch(url,  { "hello" : "world" }).then((data)=> patch_result  = data);
    await AjaxRequest.delete(url, { "hello" : "world" }).then((data)=> delete_result  = data);
    chai.expect(put_result).to.eql({ "hello" : "world", "_method": "PUT" });
    chai.expect(patch_result).to.eql({ "hello" : "world", "_method": "PATCH" });
    chai.expect(delete_result).to.eql({ "hello" : "world", "_method": "DELETE" });
  });

  it("invokes #error and #user_notification callbacks if an error occurs", async function() {
    var user_error, result;
    AjaxRequest.user_notification = message => user_error = message;
    try {
      var req = AjaxRequest.put(url + "/error", { "hello" : "world" }, data => put_result = data);
      req.catch((error) => {
        user_error = error.message;
      });
      await req;
    } catch(AjaxRequestError)  {
      chai.expect(user_error).to.equal(`Failed to connect to http://${window.location.hostname}:${window.location.port}/ajax_test/error, Not Found (404)`);
    }
    chai.expect(user_error).to.equal(`Failed to connect to http://${window.location.hostname}:${window.location.port}/ajax_test/error, Not Found (404)`);
    chai.expect(result).to.be.undefined;
  });

  it("displays notification errors about the 40x statuses to the user", async function() {
    var user_error;
    AjaxRequest.user_notification = message => user_error = message;
    AjaxRequest.display_40x = false;
    try {
      var req = AjaxRequest.put(url + "/error", { "hello" : "world" }, data => put_result = data);
      await req;
    } catch(AjaxRequestError)  {
      chai.expect(user_error).to.be.undefined;
    }
    AjaxRequest.display_40x = true;
  });

  it("displays an error message to the user if response data contains 'error' key", async function() {
    var user_error;
    AjaxRequest.user_notification = message => user_error = message;
    await AjaxRequest.post(url, { "hello" : "world", "error": "error message" }, data => put_result = data);
    chai.expect(user_error).to.equal("error message");
  });

  it("displays an error message if response status is anything other than 200", async function() {
    var user_error;
    AjaxRequest.user_notification = message => user_error = message;
    var req = AjaxRequest.post(url, { "hello" : "world", "errors": "error message", status: 401 }, data => put_result = data);
    try {
      req.then((r) => {
        console.log("ok!"); // this should never be printed to the console!
      }).catch(async function(e) {
        await e.response_promise;
      });
    } catch(AjaxRequestError) {
      await req;
      chai.expect(user_error).to.equal("error message");
    }
  });

  describe("dealing with response types", function() {

    var result;

    it("raises error if it fails to parse json", async function() {
      try {
        var req = AjaxRequest.make("/ajax_test_string", "GET", {});
        await req;
      } catch(err) {
        var result = err;
      }
      chai.expect(result.constructor.name).to.equal("SyntaxError");
    });

    it("returns plaintext body if plaintext is expected", async function() {
      var req = AjaxRequest.make("/ajax_test_string", "GET", { response_type: "text" });
      req.then((r) => result = r);
      await req;
      chai.expect(result).to.equal("hello world");
    });

    it("returns plaintext body if throw_on_wrong_response_type is set to false", async function() {
      var req = AjaxRequest.make("/ajax_test_string", "GET", { throw_on_wrong_response_type: false });
      req.then((r) => result = r);
      await req;
      chai.expect(result).to.equal("hello world");
    });

  });


});
