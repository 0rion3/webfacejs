import { extend_as }       from '../../lib/utils/mixin.js'
import { PositionManager } from '../../lib/position_manager.js'

var fn = function() {
  ["placeByCenter", "placeByTopLeft", "placeByTopRight", "placeByBottomLeft", "placeByBottomRight", "placeAboveTopLeft", "placeBelowBottomLeft", "placeAboveTopRight", "placeBelowBottomRight", "placeAboveTopRightCorner", "placeAboveTopLeftCorner", "placeBelowBottomLeftCorner", "placeBelowBottomRightCorner"].forEach((method) => {
    ["normal_position", "relative_position", "relative_parent_position", "fixed_position", "absolute_position"].forEach((pos) => {
      var pos = document.querySelector(`#${pos}`);
      if(pos == null) return;
      PositionManager[method](pos.querySelector(`#${method}_el`), pos.querySelector(`#${method}_container`));
    });
  });
}

setTimeout(fn, 100);
