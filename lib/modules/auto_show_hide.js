export const AutoShowHide = (AutoShowHide) => class extends AutoShowHide {

  /** Autohides the component (calls hide() on it) after #autohide_delay
    * time passes. Requires the component to have an #autohide_delay attribute and #autohide_promise attr
    */
  autohide() {
    return this._autoshowhide("hide");
  }

  /** Autoshows the component (calls show() on it) after #autoshow_delay
    * time passes. Requires the component to have an #autoshow_delay attribute and #autoshow_promise attr
    */
  autoshow() {
    return this._autoshowhide("show");
  }

  _autoshowhide(type) {
    var self = this;
    if(this.get(`auto${type}_delay`) != null) {
      this[`auto${type}_promise`] = new Promise((resolve, reject) => {
        setTimeout(function(){
          resolve(self[type]());
        }, this.get(`auto${type}_delay`));
      });
    } else {
      this[`auto${type}_promise`] = new Promise((resolve, reject) => { resolve(); });
    }
    return this[`auto${type}_promise`];
  }

}
