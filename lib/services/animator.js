export { Animator as default }
export const Animator = {

  // IMPORTANT: we have to use a manual Promise creation inside animation methods here
  // because browsers don't yet support Animation.finished. See https://developer.mozilla.org/en-US/docs/Web/API/Animation/finished 

  "show": function(elements, ms, { display_value="block" }={}) {
    return this._applyToCollection(elements, (el) => {
      return new Promise((resolve, reject) => {
        if((el.offsetHeight > 0 && el.offsetParent == null) || (window.getComputedStyle(el).opacity == 1 && window.getComputedStyle(el).display != "none")) {
          resolve();
          return;
        }
        el.style.display = display_value;
        el.style.opacity = ""; // This is a fix to a bug where the el disappears immediately after the animation ends. I don't know why it happens.
        var animation = el.animate([{ opacity: 0 }, { opacity : 1 }], ms);
        animation.onfinish = () => { resolve(el); };
        animation.oncancel = () => { reject(el);  };
      });

    });
  },

  "hide": function(elements, ms) {
    return this._applyToCollection(elements, (el) => {

      return new Promise((resolve, reject) => {
        var animation = el.animate([{ opacity: 1 }, { opacity : 0 }], ms);
        animation.onfinish = () => { el.style.display = "none"; resolve(el); };
        animation.oncancel = () => { reject(el);                             };
      });

    });
  },

  "slideDown": function(elements, ms, { display_value="block" }={}) {
    return this._applyToCollection(elements, (el) => {
      return new Promise((resolve, reject) => {
        if((el.offsetHeight > 0 && el.offsetParent == null) || (window.getComputedStyle(el).opacity == 1 && window.getComputedStyle(el).display != "none")) {
          resolve();
          return;
        }
        el.style.display = display_value;
        var original_height = el.getBoundingClientRect().height;
        var animation = el.animate([{ opacity: 1, height: "0px" }, { height: `${original_height}px`, opacity: 1 }], ms);
        animation.onfinish = () => { resolve(el) };
        animation.oncancel = () => { reject(el)  };
      });


    });
  },

  "slideUp": function(elements, ms) {
    return this._applyToCollection(elements, (el) => {

      return new Promise((resolve, reject) => {
        var original_height = el.getBoundingClientRect().height;
        var animation = el.animate([{ height: `${original_height}px` }, { height: "0px" }], ms);
        animation.onfinish = () => { el.style.display = "none"; resolve(el) };
        animation.oncancel = () => { reject(el)                             };
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
