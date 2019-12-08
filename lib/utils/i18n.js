import { object_to_map, merge_maps } from './map_utils.js'

export function I18n(names,doc=document) {
  return new _I18n(names,doc);
}

class _I18n {

  constructor(names="i18n", doc=document) {

    /** A Map (with multiple levels) that contains all they key/value pairs
      * with the translations.
      */
    this.data = new Map();


    /** When translation isn't found, print warning into the console.
      * It sometimes may not be a good idea (for example: Component usually has 2 translators
      * it looks into: its own and RootComponent's), thus this option.
      */
    this.print_console_warning = true;

    /** If a key is not found, we return the very same key so it doesn't screw up the
     * translation entirely. If set to false, null is returned, which may make it easier
     * to handle if you need to take certain actions when translation isn't found
     */
    this.return_key_on_not_found = true;

    /** This basically defines dom_element, which is looked up
      * which contains the json for the current I18n instance.
      * The default value here makes sense, since it's sometimes ok
      * to just have on global i18n dom_element as a container for all kinds
      * of values.
      */
    this.names = names;
    if(typeof names == "string")
      this.names = [names];
    else
      this.names = names;

    this.loadData(doc);

  }

  /** Takes an HtmlElement defined by id=$name, reads its "data-i18n-json" attribute
    * which, evidently, should contain JSON, decodes it and saves into the #data attr.
    * This method is called once while the instance is initialized.
    */
  loadData(doc=document) {
    this.names.forEach(function(n) {
      var data_holder = doc.querySelector(`#${n}_data_holder`);
      if(data_holder != null) {
        let data = JSON.parse(data_holder.getAttribute("data-i18n-json"));
        if(data != null)
          this.data = merge_maps(this.data, object_to_map(data));
      }
    }, this);
  }

  /** Dynamically adds a new key/value pair into the `data` attr. Can be
    * useful when you want to add a translation on the go.
    *
    * Arguments:
    *
    *   `key` - a String which represents a key. Could be multilevel,
    *   for example "level1.level2.greeting"
    *
    *   `value` the actual value that's going to be substituting the key
    *   in the code.
    */
  add(key, value) {
    var keys = key.split(".");
    var keys_map = value;

    keys.reverse().forEach(function(k) {
      let map = new Map();
      map.set(k, keys_map);
      keys_map = map;
    });

    this.data = merge_maps(this.data, keys_map, { deep: true });
  }

  /** The most important method which does the translation.
    *
    * Arguments:
    *
    *   `key`  - a String which represents a key. Could be multilevel,
    *   for example "level1.level2.greeting"
    *
    *   `args` - a Map of arguments and their values to be replaced inside the returned string
    *   (see _subArgs for more information).
    *
    * returns key (_ substituted for spaces) instead of the expected translation (the value for they key)
    * if translation isn't found.
    */
  t(key, args=null) {
    var keys = key.split(".");
    var last_key = keys[keys.length - 1];
    var value = this.data.get(keys.shift());

    for(var i in keys) {
      if(value == null) { break; }
      value = value.get(keys[i]);
    }

    if(value == null) {
      if(this.print_console_warning)
        window.webface.logger.capture(`translation missing for \"${key}\" in \"${this.names.join(",")}\" translator(s).`, { log_level: "WARN"});

      if(this.return_key_on_not_found)
        return last_key.replace(/_/g, " ")
      else
        return null;
    }

    if(args != null)
      value = this._subArgs(args, value);
    return value;
  }

  /** Substitues argument placeholders in a String for their values.
    * For example:
    *
    *   _subArgs("Hello %w", { "w" : "World" })
    *
    * would return "Hello World";
    */
  _subArgs(args, string) {
    for(let k in args)
      string = string.replace(new RegExp(`%${k}`), args[k]);
    return string;
  }

}
