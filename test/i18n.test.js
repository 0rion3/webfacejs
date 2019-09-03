import '../webface_init.js'
import { I18n } from './lib/i18n.js'

describe('I18n', function() {

  var i18n;

  before(function() {
    i18n = new I18n();
    var json_data = '{ "l1" : { "l2" : { "l3" : "ok", "with_placeholder": "placeholder is %x" }}}'
    var body = `<div id='i18n_data_holder' data-i18n-json='${json_data}\'></div>`
    var doc = new DOMParser().parseFromString(body, "text/xml");
    i18n.loadData(doc);
  });

  it("substitutes argument placeholders in a String for their values", function() {
    chai.expect(i18n._subArgs({ "h" : "hello", "w": "world" }, "This is a string that says %h %w in your language")).to.equal("This is a string that says hello world in your language");
  });

  it("dynamically adds a new key/value pair into the `data` attr", function() {
    i18n.add("level1.level2.level3.h", "Hello");
    i18n.add("level1.level2a.level3a.w", "World");
    chai.expect(i18n.data.get("level1").get("level2").get("level3").get("h")).to.equal("Hello");
    chai.expect(i18n.data.get("level1").get("level2a").get("level3a").get("w")).to.equal("World");
  });

  it("loads data from and HtmlElement defind by id=$name, reads its data-i18n-json attribute", function() {
    chai.expect(i18n.data.get("l1").get("l2").get("l3")).to.equal("ok");
  });

  it("translates key.chain into the translation value", function() {
    chai.expect(i18n.t("l1.l2.l3")).to.equal("ok");
    chai.expect(i18n.t("l1.l2.with_placeholder", { "x": "HELLO" })).to.equal("placeholder is HELLO");
  });

  it("returns key that wasn't found instead of a translation", function() {
    chai.expect(i18n.t("l1.l2.non_existent_key")).to.equal("non existent key");
  });

  it("returns null if key wasn't found and #return_key_on_not_found is false", function() {
    i18n.return_key_on_not_found = false;
    chai.expect(i18n.t("l1.l2.non_existent_key")).to.be.null;
    i18n.return_key_on_not_found = true;
  });

  it("reports to the console when translation is not found and #print_console_warning is set to true", function() {
    i18n.t("l1.l2.non_existent_key");
    chai.expect(window.webface.logmaster_print_spy).to.be.called.with("translation missing for \"l1.l2.non_existent_key\" in \"i18n\" translator(s).", "WARN");
  });

});
