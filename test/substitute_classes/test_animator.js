// This class exists to not apply animations when in unit tests, since we can't really
// wait for animation Promises to resovle. Instead, we use this custom TestAnimator
// to show/hide elements and resolve Promises immediately.
export var TestAnimator = {

  // IMPORTANT: we have to use a manual Promise creation inside animation methods here
  // because browsers don't yet support Animation.finished. See https://developer.mozilla.org/en-US/docs/Web/API/Animation/finished 

  "show": function(elements, ms, { display_value="block" }={}) {
    return this._applyToCollection(elements, (el) => {
      el.style.display = "block";
      el.style.opacity = "1";
      return new Promise((resolve, reject) => {
        resolve("show behavior resolved");
      });
    });
  },

  "hide": function(elements, ms) {
    return this._applyToCollection(elements, (el) => {
      el.style.display = "none";
      el.style.opacity = "0";
      return new Promise((resolve, reject) => {
        resolve("hide behavior resolved");
      });
    });
  },

  "slideDown": function(elements, ms, { display_value="block" }={}) {
    return this._applyToCollection(elements, (el) => {
      el.style.display = "block";
      el.style.opacity = "1";
      return new Promise((resolve, reject) => {
        resolve("scrollDown behavior resolved");
      });
    });
  },

  "slideUp": function(elements, ms) {
    return this._applyToCollection(elements, (el) => {
      el.style.display = "none";
      el.style.opacity = "0";
      return new Promise((resolve, reject) => {
        resolve("scrollUp behavior resolved");
      });
    });
  },

  "_applyToCollection": function(elements, func) {
    if(!(elements instanceof Array))
      elements = [elements];

    elements = elements.map((el) => {
      if(/Component$/.test(el.constructor.name))
        return el.dom_element;
      else
        return el;
    });

    return Promise.all(elements.map((el) => {
      return func(el);
    }));

  }

}
