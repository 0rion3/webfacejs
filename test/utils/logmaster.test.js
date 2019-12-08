import { Logmaster } from '../lib/utils/logmaster.js'

describe("Logmaster", function() {

  var logger;
  var console_spy;

  beforeEach(function() {
    // Those are default params, we didn't actually had to pass them (except for test_env: true, default is false).
    // They are here so that you can see what we're testing.
    logger      = new Logmaster({ reporters: { "console": "DEBUG", "http" : "ERROR" }, throw_exceptions: true, test_env: true });
    console_spy = chai.spy.on(logger, "_print");
  });

  it("reports error only if error log_level is higher or equals to that of a particular reporter", function() {
    var console_reporter_spy = chai.spy.on(logger, "_report_to_console");
    var http_reporter_spy = chai.spy.on(logger, "_report_to_http");
    logger.capture("error", { log_level: "WARN"});
    logger.capture("error", { log_level: "ERROR"});
    chai.expect(console_reporter_spy).to.have.been.called.exactly(2);
    chai.expect(http_reporter_spy).to.have.been.called.exactly(1);
  });

  it("logs the stacktrace if error passed is Error", function() {
    var console_reporter_spy = chai.spy.on(logger, "_report_to_console");
    logger.throw_errors = false;
    logger.capture(new Error("error"));
    chai.expect(logger.last_error.stack_trace).to.not.be.empty;
  });

  describe("console reporter", function() {

    it("reports error to console", function() {
      logger.capture("error1", { log_level: "WARN"});
      chai.expect(console_spy).to.be.called.with("error1", "WARN");
    });

    it("doesn't report errors to the console if #throw_errors flag is true", function() {
      logger.capture("error2", { log_level: "ERROR"});
      chai.expect(console_spy).to.not.be.called.with("error2", "WARN");
    });

  });

  describe("http reporter", function() {

    it("reports error to http via a post ajax request", function() {
      logger.capture("error3", { log_level: "ERROR"});
      // Nothing to check, just that the error isn't raise. We'd essentially be testing a fetch() function,
      // which is async and we want it to stay that way. So it's just very inconvenient to test it. Let's
      // just make sure no errors are raised with this test.
    });

  });

});
