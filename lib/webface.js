import { Logmaster                   } from './logmaster.js'
import { Animator                    } from './animator.js'
import { Component                   } from './component.js'
import { RootComponent               } from './components/root_component.js'
import { ButtonComponent             } from './components/button_component.js'
import { CheckboxComponent           } from './components/checkbox_component.js'
import { FormFieldComponent          } from './components/form_field_component.js'
import { NumericFormFieldComponent   } from './components/numeric_form_field_component.js'
import { ModalWindowComponent        } from './components/modal_window_component.js'
import { DialogWindowComponent       } from './components/dialog_window_component.js'
import { RadioButtonComponent        } from './components/radio_button_component.js'
import { HintComponent               } from './components/hint_component.js'
import { SimpleNotificationComponent } from './components/simple_notification_component.js'
import { SelectComponent             } from './components/select_component.js'
import { EditableSelectComponent     } from './components/editable_select_component.js'
import { ConfirmableButtonComponent  } from './components/confirmable_button_component.js'
import { ContextMenuComponent        } from './components/context_menu_component.js'

window.webface.substitute_classes = {
  "Animator": Animator
}

export var Webface = {

  "init": (root_el=document.querySelector("body")) => {

    window.webface["logger"] = new Logmaster({test_env: false})

    var root = new RootComponent();
    window.webface["root_component"] = root;
    root.dom_element = root_el;
    root.initChildComponents();

  },

}
