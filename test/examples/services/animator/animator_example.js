import Animator from '../../../lib/services/animator.js'

var obj = document.querySelector("#object");

["hide", "show", "slideDown", "slideUp"].forEach((method) => {
  var button = document.querySelector(`#${method}`);
  button.addEventListener("click", () => {
    Animator[method](obj, 1500);
  });
});
