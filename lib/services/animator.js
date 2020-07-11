export { Animator as default }
export const Animator = {

  // IMPORTANT: we have to use a manual Promise creation inside animation methods here
  // because browsers don't yet support Animation.finished. See https://developer.mozilla.org/en-US/docs/Web/API/Animation/finished 

  show: function(elements, duration_ms, { display_value="block" }={}) {
    return this._applyToCollection(elements, (el) => {
      return this.animateEl(
        el, [{ opacity: 0 }, { opacity : 1 }],
        duration_ms, { core_animation: "show", display_value: display_value }
      );
    });
  },

  hide: function(elements, duration_ms) {
    return this._applyToCollection(elements, (el) => {
      return this.animateEl(
        el, [{ opacity: 1 }, { opacity : 0 }],
        duration_ms, { core_animation: "hide" }
      );
    });
  },

  slideDown: function(elements, duration_ms, { display_value="block" }={}) {
    return this._applyToCollection(elements, (el) => {
      var original_height = el.getBoundingClientRect().height;
      return this.animateEl(
        el, [{ opacity: 1, height: "0px" }, { height: `${original_height}px`, opacity: 1 }],
        duration_ms, { core_animation: "show", display_value: display_value }
      );
    });
  },

  slideUp: function(elements, duration_ms) {
    return this._applyToCollection(elements, (el) => {
      var original_height = el.getBoundingClientRect().height;
      return this.animateEl(
        el, [{ height: `${original_height}px` }, { height: "0px" }],
        duration_ms, { core_animation: "hide" }
      );
    });
  },

  isVisible: function(el) {
    return (el.offsetHeight > 0 && el.offsetParent == null) ||
           (window.getComputedStyle(el).opacity > 0 && window.getComputedStyle(el).display != "none")
  },

  animateEl: function(el, properties, duration_ms, { core_animation="show", display_value="block" }={}) {

    return new Promise((resolve, reject) => {

      if(core_animation == "show") {
        if(this.isVisible(el)) {
          resolve(el); return;
        }
        el.style.display = display_value;
      } else if(core_animation == "hide" && !this.isVisible(el)) {
        resolve(el); return;
      }

      if(window.webface.document_hidden) {
        resolve(el);
      } else {
        if(duration_ms == null || duration_ms === 0) {
          core_animation == "show" ? el.style.display = display_value : el.style.display = "none";
          resolve(el);
        } else {
          if(core_animation == "show") {
            // This is a fix to a bug where the el disappears immediately after the animation ends.
            // I don't know why it happens.
            el.style.opacity = "";
          }
          var animation = el.animate(properties, duration_ms);
          animation.onfinish = () => {
            if(core_animation == "hide")
              el.style.display = "none";
            resolve(el);
          }
          animation.oncancel = () => { reject(el); };
        }

      }

    });

  },

  _applyToCollection: function(elements, func) {
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
