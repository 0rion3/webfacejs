const express  = require('express')
var bodyParser = require('body-parser');
const fs       = require('fs');
const app      = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.set('view engine', 'pug')

app.get("/", function (req, res) {
  var file = req.query.file;
  if(file == "" || file == null)
    file = "webface.test.js";
  else if(file.startsWith("test"))
    file = file.replace("test", "");

  fs.readFile(`test/mocha.html`, 'utf8', function(err, contents) {
    res.render(__dirname + "/test/mocha.pug", { file: file });
  });
})

app.post("/report_webface_error", function (req, res, next) {
  res.type("text/plain");
  res.end("OK");
});

app.post("/ajax_test", function (req, res, next) {
  ajax_test_response(res, req);
});
app.put("/ajax_test", function (req, res, next) {
  ajax_test_response(res, req);
});
app.patch("/ajax_test", function (req, res, next) {
  ajax_test_response(res, req);
});
app.delete("/ajax_test", function (req, res, next) {
  ajax_test_response(res, req);
});
function ajax_test_response(res, req) {
  res.type("application/json");
  let status = 200;
  if(req.body.status != null && req.body.status != 200) status = req.body.status;
  req.body["_method"] = req.method;
  res.status(status).end(JSON.stringify(req.body));
}

app.get("/ajax_test", function (req, res, next) {
  res.type("application/json");
  res.end(JSON.stringify(req.query));
});

app.get("/ajax_test_string", function (req, res, next) {
  res.type("text/plaintext");
  res.end("hello world");
});

app.get("/select_component_options", function (req, res, next) {
  res.type("application/json");
  res.end('{ "key1": "b - fetched key 1", "key2": "c - fetched key 2", "key3": "a - fetched key 3" }');
});

app.get(/.+/, function (req, res) {
  var fn = req.path.substring(1);
  if(fn.endsWith("/")) fn = fn.slice(0, -1);

  var fn_splitted = fn.split("/");
  var fn_last_part = fn_splitted[fn_splitted.length - 1]


  if(/^[^.]+$/.test(fn_last_part))
    fn = fn + "/index.html";

  if(fs.existsSync(`test/${fn}`)) {
    fs.readFile(`test/${fn}`, 'utf8', function(err, contents) {
      if(fn.endsWith(".js"))
        res.type("application/javascript");
      else if(fn.endsWith(".svg")) {
        res.type("image/svg+xml");
      }
      else if(fn.endsWith(".css"))
        res.type("text/css");
      else
        res.type("text/html");
      res.end(contents);
    });
  }
  else {
    res.status(404).send("Not found");
  }


})

app.listen(8080, () => console.log('Test server for Webface.js running on port 8080.'))
