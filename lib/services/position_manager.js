export { PositionManager as default }
const PositionManager = {

  "base_offset": { "x": 0, "y": 0 },

  "getPosition": function(el) {
    var pos = el.getBoundingClientRect();
    return { 'x': pos.left, 'y': pos.top };
  },

  "getRelPosition": function(el1, el2) {
    var pos1 = this.getPosition(el1);
    var pos2 = this.getPosition(el2);
    return { 'x' : pos1['x'] - pos2['x'], "y" : pos1['y'] - pos2['y'] };
  },

  "getDimensions": function(el) {
    var pos = el.getBoundingClientRect();
    return { 'x': pos.width, 'y': pos.height };
  },
  
  "placeAt": function(el,x,y, { fixed_position=false }={}) {
    document.querySelector("body").append(el);

    if(fixed_position) {
      var scroll_offset = { "x": 0, "y" : 0 };
      el.style.position = "fixed";
    } else {
      var scroll_offset = { "x": window.scrollX, "y" : window.scrollY };
      el.style.position = "absolute";
    }

    el.style.top  = (`${y + scroll_offset['y']}px`);
    el.style.left = (`${x + scroll_offset['x']}px`);
  },

  "placeBy": function(el1, el2, { left=0.0, top=0.0, gravity_top=0.0, gravity_left=0.0 }={}) {
    
    var el2_pos = this.getPosition(el2);
    var el1_dim = this.getDimensions(el1);
    var el2_dim = this.getDimensions(el2);

    var pos_offset     = { 'x': el2_dim['x']*left, 'y': el2_dim['y']*top };
    var gravity_offset = { 'x': el1_dim['x']*gravity_left , 'y': el1_dim['y']*gravity_top };
    var new_pos        = { 'x': pos_offset['x']+el2_pos['x']-gravity_offset['x'], 'y': pos_offset['y']+el2_pos['y']-gravity_offset['y'] };

    var base_offset_for_el;
    if(this.base_offset.units == "px")
      base_offset_for_el = { "x": this.base_offset["x"], "y": this.base_offset["y"] };
    else
      base_offset_for_el = { "x": this.base_offset["x"]*el1_dim["x"], "y": this.base_offset["y"]*el1_dim["y"] };

    if(new_pos['x'] < el2_pos['x'])
      base_offset_for_el['x'] = -base_offset_for_el['x'];
    if(new_pos['y'] < el2_pos['y'])
      base_offset_for_el['y'] = -base_offset_for_el['y'];

    // Find out whether any of the ancestors of the el2 have "position: fixed".
    // If we don't do it, el1 might appear displaced.
    var parent_el2 = el2;
    var fixed_pos  = false;
    while(parent_el2 != null) {
      if(window.getComputedStyle(parent_el2).position == "fixed") {
        fixed_pos = true;
        break;
      }
      parent_el2 = parent_el2.parentElement;
    }

    new_pos = { "x" : new_pos['x'] + base_offset_for_el['x'], "y" : new_pos['y'] + base_offset_for_el['y'] };

    this.placeAt(el1, new_pos['x'], new_pos['y'], { fixed_position: fixed_pos });

  },

  "placeByCenter": function(el1, el2) {
    this.placeBy(el1, el2, { top: 0.5, left: 0.5, gravity_top: 0.5, gravity_left: 0.5 });
  },

  "placeByTopLeft": function(el1, el2) {
    this.placeBy(el1, el2);
  },

  "placeByTopRight": function(el1, el2) {
    this.placeBy(el1, el2, { left: 1.0, gravity_left: 1.0 });
  },

  "placeByBottomLeft": function(el1, el2) {
    this.placeBy(el1, el2, { top: 1.0, gravity_top: 1.0 });
  },

  "placeByBottomRight": function(el1, el2) {
    this.placeBy(el1, el2, { top: 1.0, left: 1.0, gravity_left: 1.0, gravity_top: 1.0 });
  },

  "placeAboveTopLeft": function(el1, el2) {
    this.placeBy(el1, el2, { gravity_top: 1.0 });
  },

  "placeBelowBottomLeft": function(el1, el2) {
    this.placeBy(el1, el2, { top: 1.0 });
  },

  "placeAboveTopRight": function(el1, el2) {
    this.placeBy(el1, el2, { left: 1.0, gravity_left: 1.0, gravity_top: 1.0 });
  },

  "placeBelowBottomRight": function(el1, el2) {
    this.placeBy(el1, el2, { top: 1.0, left: 1.0, gravity_left: 1.0 });
  },

  "placeAboveTopRightCorner": function(el1, el2) {
    this.placeBy(el1, el2, { left: 1.0, gravity_top: 1.0 });
  },

  "placeAboveTopLeftCorner": function(el1, el2) {
    this.placeBy(el1, el2, { gravity_top: 1.0, gravity_left: 1.0 });
  },

  "placeBelowBottomLeftCorner": function(el1, el2) {
    this.placeBy(el1, el2, { top: 1.0, gravity_left: 1.0 });
  },

  "placeBelowBottomRightCorner": function(el1, el2) {
    this.placeBy(el1, el2, { top: 1.0, left: 1.0 });
  }

}
