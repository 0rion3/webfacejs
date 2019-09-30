export const ComponentDom = (ComponentDom) => class extends ComponentDom {

  /** Dom element is what it is: a DOM element in our HTML page, which is associated
   *  with the current component and to which callacks are attached (the natives ones).
   *  We need a custom setter to start listening to the native events that we list in
   *  the #native_events attr.
   */
  get dom_element() { return this._dom_element };
  set dom_element(el) {
    this._dom_element = el;
    this.use_default_html_attrs_for_attrs = true;
    if(el != null)
      this._assignRolesFromDomElement();
  }

  /** It's not always the `document` object that is used to find templates and for other things.
   * Sometimes (in unit tests, for example) it's easier to use a different custom object
   * instead of the real `document` one offered by the browser. These getter & setter
   * provide a way to replace the standard `document` object to be used.
   */
  static get owner_document() {
    if(this._owner_document == null)
      return document;
    else
      return this._owner_document;
  }
  static set owner_document(doc) {
    this._owner_document = doc;
  }

  // Default casting methods applicable to all Component, added with
  // `this.attribute_casting = ComponentDom.attribute_casting` in Component constructor.
  // Can be augmented or customized by each Component individually adding methods
  // to the `this.attribute_casting` object.
  static get attribute_casting() { return {
    'to_dom': {
      'default' : (v) => (v === null || v === false) ? "" : v.toString()
    },
    'from_dom': {
      'default' : (v) => {
        if(["true", "false"].includes(v))
          return v == "true";
        else if(v == "null")
          return null;
        else if(/^\d+\.\d*$/.test(v)) // it's a float!
          return parseFloat(v);
        else if(/^\d+$/.test(v)) // it's an integer!
          return parseInt(v);
        else if(typeof v == "string") { // it's a string!
          if(/^\s*$/.test(v)) return null;
          else                return v;
        }
      }
    }
  }}

  /** Clones #template and assigns the clone to #dom_element, then sets all the attributes */
  initDomElementFromTemplate() {
    if(this.template != null) {
      this.dom_element = new DOMParser().parseFromString(this.template.outerHTML, "text/html").documentElement.querySelector(`body>[data-component-template="${this.constructor.name}"]`);
      this.dom_element.removeAttribute('data-component-template');
      this.dom_element.setAttribute('data-component-class', this.constructor.name);


      this.attribute_names.forEach((a) => {
        // If Component object has an attribute value defined, we update DOM attrs with its value
        if(this.get(a) != undefined) this._writeAttrToNode(a, this.get(a));
        // If not, we try to read that value from DOM and update Component object's attribute.
        else this.updateAttrsFromNodes({ attrs: [a] });
      }, this);
    }
  }

  /** Finds first DOM ancestor with a certain combination of attribute and its value,
   *  or returns the same node if that node has that combination.
   */
  ancestorOrSelfWithAttr(node, { attr_name=null, attr_value=null }={}) {
    var ancestor = node;
    while(ancestor != null && ancestor.getAttribute(attr_name) != attr_value)
      ancestor = ancestor.parentElement;
    return ancestor;
  }

  /** Same as firstDomDescendantOrSelfWithAttr, but finds all dom elements
    * and returns a List
    */
  allDomDescendantsAndSelfWithAttr(node, { attr_name=null, attr_value=null, first_only=false }={}) {
    var actual_attr_value = node.getAttribute(attr_name);

    if(attr_value instanceof RegExp && actual_attr_value != null && attr_value.test(actual_attr_value))
      return [node];
    else if(attr_name == null || node.getAttribute(attr_name) == attr_value)
      return [node];
    else if(node.children.length == 0)
      return [];

    var elements = [];
    Array.from(node.children).some(function(c) {
      if(c.getAttribute('data-component-class') == null) {
        var children_elements = this.allDomDescendantsAndSelfWithAttr(c, { attr_name: attr_name, attr_value: attr_value });
        if(children_elements != null)
          elements = elements.concat(children_elements);
        if(elements.length > 0 && first_only)
          return true;
      }
    }, this);

    return elements;
  }

  /** Finds first DOM descendant with a certain combination of attribute and its value,
   *  or returns the same node if that node has that combination.
   *
   *  This method is needed when we want to listen to #dom_element's descendant native events
   *  or when an attrubute has changed and we need to change a correspondent descendant node.
   */
  firstDomDescendantOrSelfWithAttr(node, { attr_name=null, attr_value=null }={}) {
    var elements = this.allDomDescendantsAndSelfWithAttr(node, { attr_name: attr_name, attr_value: attr_value, first_only: true});
    return (elements != null && elements.length > 0) ? elements[0] : null;
  }

  /** Gets a list of all DOM-descendants of the #dom_element that are not included
    * into other child Component DOM-structures. The returned List lacks proper hierarchy.
    */
  allDomDescendants(node, { skip_components=true }={}) {
    var elements = [];
    if(node != null) {
      Array.from(node.children).forEach(function(c) {
        if(c.getAttribute('data-component-class') == null || !skip_components) {
          elements.push(c);
          elements = elements.concat(this.allDomDescendants(c, { skip_components: skip_components }));
        }
      }, this);
    }
    return elements;
  }

  /** Finds all HtmlElements representing parts of the current component which match the name provided. */
  findAllParts(name) {
    return this.allDomDescendantsAndSelfWithAttr(this.dom_element, { attr_name: 'data-component-part', attr_value: name });
  }

  /** Finds the first HtmlElement representing a part of the current component which matches the name provided. */
  findPart(name) {
    return this.firstDomDescendantOrSelfWithAttr(this.dom_element, { attr_name: 'data-component-part', attr_value: name });
  }

  /** Finds attribute node in the DOM */
  findAttrElements(attr_name) {
    var attr_els = this.allDomDescendantsAndSelfWithAttr(
      this.dom_element,
      { attr_name: "data-component-attr",
        attr_value: attr_name
      }
    );

    // Search elements with data-component-attr-map first
    attr_els = attr_els.concat(this.allDomDescendantsAndSelfWithAttr(
      this.dom_element,
      {
        attr_name: "data-component-attr-map",
        // Find corresponding html attributes for attributes of the format
        // attr_name:html_attr_name
        attr_value: new RegExp(`(^|,| +)${attr_name}:`)
      }
    ));

    // ********* Suppport for DEPRECATED code: find dom elements with data-component-property html attribute
    var attr_els_deprecated = this.allDomDescendantsAndSelfWithAttr(
      this.dom_element,
      { attr_name: "data-component-property",
        attr_value: attr_name
      }
    );
    // ********* Suppport for DEPRECATED code: find dom elements with data-component-attribute-properties html attribute
    attr_els_deprecated = attr_els_deprecated.concat(this.allDomDescendantsAndSelfWithAttr(
      this.dom_element,
      {
        attr_name: "data-component-attribute-properties",
        // Find corresponding html attributes for attributes of the format
        // attr_name:html_attr_name
        attr_value: new RegExp(`(^|,| +)${attr_name}:`)
      }
    ));
    if(attr_els_deprecated.length > 0) {
      window.webface.logger.capture(
        "data-component-property & data-component-attribute-properties html attributes\n" +
        "are now deprecated in Webface.js - use data-component-attr & data-component-attr-map respectively.\n" +
        `You're using the deprecated version for ${this.constructor.name}'s '${attr_name}' attribute.`,
        { log_level: "WARN" }
      );
      attr_els = attr_els.concat(attr_els_deprecated);
    }
    // ******* end of support for DEPRECATED code ********************

    // If we can't find those, just default to data-some-attr-name elements
    if(attr_els.length == 0 && this.use_default_html_attrs_for_attrs) {
      attr_els = this.allDomDescendantsAndSelfWithAttr(
        this.dom_element,
        {
          attr_name: `data-${attr_name.replace(/_/g, '-')}`,
          attr_value: new RegExp(".*")
        }
      );
    }

    return attr_els;
  }

  // ********* Suppport for DEPRECATED code: alias method for findAttrElements();
  findPropertyElements(attr_name) {
    window.webface.logger.capture(
      'ComponentDom.findPropertyElements() method is deprecated, use findAttrElements() instead',
      { log_level: "WARN" }
    );
    return this.findAttrElements(attr_name);
  }
  // ******* end of support for DEPRECATED code ********************

  findFirstAttrElement(attr_name) {
    var els = this.findAttrElements(attr_name);
    return els.length > 0 ? els[0] : null;
  }

  // ********* Suppport for DEPRECATED code: alias method for findFirstAttrElement();
  findFirstPropertyElement(attr_name) {
    window.webface.logger.capture(
      'ComponentDom.findFirstPropertyElement() method is deprecated, use findFirsAttrElement() instead',
      { log_level: "WARN" }
    );
    return this.findFirstAttrElement(attr_name);
  }
  // ******* end of support for DEPRECATED code ********************

  /** Updates all attribute values from their DOM nodes values.
    * If provided with an optional List of attribute names, updates only
    * attributes that are on that List.
    */
  updateAttrsFromNodes({ attrs=false, invoke_callbacks=false }={}) {
    if(attrs == false)
      attrs = this.attribute_names;
    attrs.forEach(function(a) {
      this._readAttrFromNode(a, { run_callback: invoke_callbacks });
    }, this);
  }

  // ********* Suppport for DEPRECATED code: alias method for updateAttrsFromNodes();
  updatePropertiesFromNodes({ attrs=false, invoke_callbacks=false }={}) {
    window.webface.logger.capture(
      'ComponentDom.updatePropertiesFromNodes() method is deprecated, use updateAttrsFromNodes() instead',
      { log_level: "WARN" }
    );
    return this.updateAttrsFromNodes({ attrs: attrs, invoke_callbacks: invoke_callbacks });
  }
  // ******* end of support for DEPRECATED code ********************

  /** Reads attribute value from a DOM node, updates Component's object attribute with the value */
  _readAttrFromNode(attr_name, { run_callback=false }={}) {

    var attr_el = this.findFirstAttrElement(attr_name);
    if(attr_el != null) {
      var v;
      var pa = attr_el.getAttribute('data-component-attr-map');
      if(pa == null) pa = this._getDeprecatedDataComponentAttributeProperties(pa, attr_el);

      if(pa != null) {
        var html_attr_name = this._getHtmlAttributeNameForAttr(pa, attr_name);
        v = attr_el.getAttribute(html_attr_name);
      } else if(attr_el.getAttribute(`data-${attr_name.replace(/_/g, "-")}`) && this.use_default_html_attrs_for_attrs ) {
        v = attr_el.getAttribute(`data-${attr_name.replace(/_/g, "-")}`);
      }
      else {
        v = attr_el.textContent;
        // Ignore whitespace. If you need to preserve whitespace,
        // use html-attribute-based attributes instead.
        v = v.replace(/^\s+/, "");
        v = v.replace(/\s+$/, "");
      }

      // Only read if attribute really exists (ignore undefined values)
      if(v) this.set(attr_name, this._castAttrFromDom(attr_name, v), { run_callback: run_callback });
    }
  }


  /** Updates dom element's #text or attribute so it refelects Component's current attr value. */
  _writeAttrToNode(attr_name) {

    if(this.dom_element == null) return;
    if(this.get(attr_name) === undefined) return;

    var attr_els = this.findAttrElements(attr_name);

    if(attr_els.length == 0 && this.attributes[attr_name] &&
       this.use_default_html_attrs_for_attrs) {
      this.dom_element.setAttribute(`data-${attr_name.replace(/_/g, "-")}`, this.attributes[attr_name].toString());
      return;
    }

    attr_els.forEach(function(attr_el) {
      if(attr_el != null) {

        if(attr_el.getAttribute('data-component-attr') == attr_name) {
          if(attr_el.tagName.toLowerCase() == "input") {
            attr_el.value = this._castAttrToDom(attr_name);
            attr_el.setAttribute("value", attr_el.value);
          } else {
            attr_el.textContent = this._castAttrToDom(attr_name);
          }
        } else {
          var pa = attr_el.getAttribute('data-component-attr-map');
          if(pa == null) pa = this._getDeprecatedDataComponentAttributeProperties(pa, attr_el);

          var html_attr_name = this._getHtmlAttributeNameForAttr(pa, attr_name);
          if(!this.attributes[attr_name]) {
            if(html_attr_name == "value")
              attr_el.value = null;
            attr_el.removeAttribute(html_attr_name);
          }
          else {
            attr_el.setAttribute(html_attr_name, this._castAttrToDom(attr_name));
            if(html_attr_name == "value")
              attr_el.value = this._castAttrToDom(attr_name);
          }
        }

      }
    }, this);
  }

  /** Component attr may contain numbers, boolean and other things, while HTML only supports stirngs.
    * This method takes care of the casting from js to HTML. It uses a default casting method, while allowing custom converters for
    * each particular attribute.
  */
  _castAttrToDom(attr_name) {
    return this._castAttr("to", attr_name);
  }

  /** Component attr may contain numbers, boolean and other things, while HTML only supports stirngs.
    * This method takes care of the conversion. It uses the default converter, while allowing custom converters for
    * each particular attribute.
  */
  _castAttrFromDom(attr_name, v) {
    return this._castAttr("from", attr_name, v);
  }

  _castAttr(direction, attr_name, v=null) {
    if(!v) v = this.get(attr_name);
    var cast_function = this.attribute_casting[`${direction}_dom`][attr_name];
    if(cast_function != null)
      return cast_function(v);
    else
      return this.attribute_casting[`${direction}_dom`]["default"](v);
  }

  /** Finds whether the dom_element's descendants have a particular node
    * or if it itself is this node.
    */
  _hasNode(node, { skip_components=true }={}) {
    if(node == this.dom_element)
      return true;
    var result = false;
    this.allDomDescendants(this.dom_element, { skip_components: skip_components }).forEach(function(descendant) {
      if(node == descendant) result = true;
    });
    return result;
  }

  /** Defines behavior for removal of the #dom_element
    * Redefine this method to have something fancier (like an animation)
    * for when the #dom_element is removed.
    */
  _removeDomElement({ ignore_null_dom_element=false }={}) {
    try {
      this.dom_element.remove();
    } catch(e) {
      if(!ignore_null_dom_element) throw(e);
    }
  }

  _getHtmlAttributeNameForAttr(attr_list, attr_name) {
    if(attr_list != null) {
      var attr_list_regexp = new RegExp(`${attr_name}:[a-zA-Z0-9_\-]+`);
      var match = attr_list_regexp.exec(attr_list)
      if(match != null)
        return match[0].split(':')[1];
      else if(this.use_default_html_attrs_for_attrs)
        return `data-${attr_name.replace(/_/g, '-')}`;
    }
    return null;
  }

  /** Finds the template HtmlElement in the dom and assigns it to #template */
  _initTemplate() {
    if(this.template_name == null)
      return this.template = this.constructor.owner_document.querySelector(`[data-component-template=${this.constructor.name}]`);
    else
      return this.template = this.constructor.owner_document.querySelector(`[data-component-template=${this.constructor.name}][data-template-name=${this.template_name}]`);

  }

  _assignRolesFromDomElement() {
    var roles_attr = this._dom_element.getAttribute('data-component-roles');
    if(roles_attr != null)
      this.roles = this._dom_element.getAttribute('data-component-roles').split(/,\s?/);
  }

  /**  In order to be able to instatiate nested components, we need to find descendants of the #dom_element
    *  which have data-component-class attribute. This method takes care of that.
    */
  _findChildComponentDomElements(node) {
    var component_children = [];
    Array.from(node.children).forEach(function(c) {
      if(c.getAttribute('data-component-class') == null)
        component_children = component_children.concat(this._findChildComponentDomElements(c));
      else
        component_children.push(c);
    }, this);
    return component_children;
  }

  /** This method defines a default behavior when a new child is added.
    * Makes sense to append child dom_element to the parent's dom_element.
    * Of course, this might not always be desirable, so this method may be
    * redefined in descendant calasses.
    */
  _appendChildDomElement(el) {
    this.dom_element.appendChild(el);
  }

  _getDeprecatedDataComponentAttributeProperties(pa, attr_el) {
    // ********* Suppport for DEPRECATED code: check data-component-attribute-properties html attribute
    pa = attr_el.getAttribute('data-component-attribute-properties');
    if(pa != null) {
      window.webface.logger.capture(
        'data-component-attribute-properties html attribute is deprecated, use data-component-attr-map instead',
        { log_level: "WARN" }
      );
    }
    return pa;
    // ******* end of support for DEPRECATED code ******************** 
  }

}
