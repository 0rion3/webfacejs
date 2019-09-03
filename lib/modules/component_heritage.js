export const ComponentHeritage = (ComponentHeritage) => class extends ComponentHeritage {

  /** Very important! Components are nested.
   *  This method goes through the #dom_element descendants looking for elements which
   *  have data-component-class attribute. If found, a new Component is created with the class
   *  specified in this attribute. Obviously, you should define such a class beforehand and
   *  inherit from Component.
  */
  initChildComponents({ recursive=true, afterInitialize=true }={}) {

    var elements = this._findChildComponentDomElements(this.dom_element);

    elements.forEach(function(el) {
      var component_class_name = el.getAttribute("data-component-class");
      var component_class = window.webface.component_classes[component_class_name];
      if(component_class) {
        var component = new component_class();
        // The order is very important here: we want to first assign dom_element, add
        // component as a child to its parent and init its own children.
        component.dom_element = el;
        this.addChild(component, { initialize: false });
        if(recursive) component.initChildComponents();
      } else {
        window.webface.logger.report(`\`${component_class_name}\` `                                                               +
                                     'not found in any of the files of the Webface app, but a corresponding html-element exists:' +
                                     "\n---\n"                                                                                    +
                                     el.outerHTML                                                                                 +
                                     "\n---", "WARN"
                                    )
      }

    }, this);

    if (afterInitialize) this.afterInitialize();
    this.publishEvent("initialized");
  }

  /** Finds immediate children with a specific role */
  findChildrenByRole(r) {
    var children_with_roles = [];
    this.children.forEach(function(c) {
      if(c.roles.includes(r))
        children_with_roles.push(c);
    }, this);
    return children_with_roles;
  }

  /** Finds the first child with a specified role
    * Not this method knows nothing about the order of children in the DOM!
    */
  findFirstChildByRole(r) {
    var children = this.findChildrenByRole(r);
    if(children.length > 0)
      return children[0];
    else
      return null;
  }

  /** Finds all descendants which satisfy role path.
    * For example, if the current element has a child with role 'form' and
    * this child in turn has a child with role 'submit', then calling
    *
    *   findDescendantsByRole('form.submit')
    *
    * will find that child, but calling
    *
    *   findDescendantsByRole('submit')
    *
    * will NOT and would be equivalent to calling
    *
    *   findChildrenByRole('submit')
    *
    * returning an empty List [].
    *
   */
  findDescendantsByRole(r) {
    var role_path  = r.split('.');
    if(role_path[0] == "*")
      return this.findAllDescendantsByRole(role_path.pop());
    else
      return this.findDescendantsByRolePath(role_path);
  }

  findDescendantsByRolePath(role_path) {
    var child_role = role_path.shift();
    var children_with_roles = this.findChildrenByRole(child_role);

    if(role_path.length > 0) {
      var descendants_with_roles = [];
      children_with_roles.forEach(function(c) {
        descendants_with_roles = descendants_with_roles.concat(c.findDescendantsByRolePath(role_path));
      }, this);
      return descendants_with_roles;
    } else {
      return children_with_roles;
    }
  }

  findAllDescendantsByRole(role) {
    var descendants = [];
    this.children.forEach(function(c) {
      // Note how we stop recursion if we find a component with the role. Theoretically,
      // there might be nested components with the same roles, but it's a good idea to NOT
      // go too deep - these would be very complicated edge cases and the behavior may not
      // even be desirable.
      if(c.roles.includes(role))
        descendants.push(c);
      else
        descendants = descendants.concat(c.findAllDescendantsByRole(role));
    }, this);
    return descendants;
  }

  findAllDescendantInstancesOf(component_class, { continue_search_deeper_when_found=false }={}) {
    var descendants = [];
    this.children.forEach(function(c) {
      // Note how BY DEFAULT we stop recursion if we find a component of the right instance. Theoretically,
      // there might be nested components with the same roles, but it's a good idea to NOT
      // go too deep - these would be very complicated edge cases and the behavior may not
      // even be desirable.
      //
      // You can enable the functionality of looking deeper by setting continue_search_deeper_when_found to true when
      // calling this method.
      if(c instanceof component_class)
        descendants.push(c);
      if(continue_search_deeper_when_found || !(c instanceof component_class))
        descendants = descendants.concat(c.findAllDescendantInstancesOf(component_class, { continue_search_deeper_when_found: continue_search_deeper_when_found }));
    }, this);
    return descendants;
  }

  /** Reloading Heritable#addChild to automatically do the following things
    * when a child component is added:
    *
    * 1. Initialize a dom_element from template
    * 2. Append child's dom_element to the parent's dom_element.
    *
    * Obviously, you might not always want (2), so just redefine #_appendChildDomElement()
    * method in your class to change this behavior.
    */
  addChild(child, { initialize=true }={}) {
    super.addChild(child, { initialize: initialize });
    child.addObservingSubscriber(this);
    // We only do it if this element is clearly not in the DOM.
    if(child.dom_element == null || child.dom_element.parentNode == null) {
      child.initDomElementFromTemplate();
      this._appendChildDomElement(child.dom_element);
    }

    if(initialize)
      child.afterInitialize();

  }

  /** Calls a specific method on all of its children. If method doesn't exist on one of the
    * children, ignores and doesn't raise an exception. This method is useful when we want to
    * communicate a common an action to all children, such as when we want to reset() all form
    * elements.
    *
    * The last argument - `condition` - is a function which is passed a child component.
    * The method is not called on any child for which the function returned false.
    * If condition argument is `null` (or nothing passed), then the method is called
    * on all children regardless.
    */
  applyToChildren(method_name, { args=[], recursive=false, condition=null }={}) {
    this.children.forEach(function(c) {
      if((condition == null || (condition != null && condition(c))) && typeof c[method_name] === 'function')
        c[method_name](...args);
      // We don't apply condition check to the recursive call. Condition check is the responsibility
      // of each individual component.
      if(recursive != false)
        c.applyToChildren(method_name, { args: args, recursive: recursive, condition: condition });
    });
  }

}
