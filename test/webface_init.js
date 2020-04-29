import TestAnimator from '../substitute_classes/test_animator.js'
import Logmaster    from '../lib/services/logmaster.js'

window.webface = {
  "component_classes" : {},
  "logger"            : new Logmaster({test_env: true}),
  "substitute_classes": { "Animator": TestAnimator }
};

window.webface.logmaster_print_spy = chai.spy.on(window.webface.logger, "_print");
