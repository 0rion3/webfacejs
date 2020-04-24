import { string_to_array_or_object } from "../../utils/string_helpers.js";
import { StateManager }              from "./state_manager.js";

export class DisplayStateManager extends StateManager {

  static get short_name() { return "display" }

  constructor({ component=null, alias_manager=null, states=[], settings={}}={}) {
    super({ component: component, alias_manager: alias_manager, states: states});

    let default_settings = {
      default_state_action: "show",
      hide_animation_speed: 500,
      show_animation_speed: 500,
    };
    this.settings = { ...default_settings, ...settings };

    this.entities = this._extractDisplayStateEntities();
    this.queue    = [];

    if(this.settings.default_state_clear_action == null) {
      if(this.settings.default_state_action == "hide")
        this.settings.default_state_clear_action = "show";
      else
        this.settings.default_state_clear_action = "hide";
    }

    // Apply the default "clear" action on initialization.
    // Usually it means hiding all parts and child components listed in this.component.display_states
    if(this.component.display_state_apply_clear_state_on_init)
      this.clear();

  }

  applyTransitionNow(transitions, transition_promise) {
    this.queue.push({
      display_state: [
        this.entities.filter(e => !transitions.includes(e)),
        transitions
      ], transition_promise: transition_promise
    });
    if(this.queue.length == 1)
     this._applyLatestTransition();
  }

  async clear() {
    this._applyBehaviorToEntities(this.settings.default_state_clear_action, this.entities, { animation_speed: 1 });
  }

  _findEntity(name) {
    if(name[0] == "#") { // it's a role
      return this.component.findChildrenByRole(name.slice(1, name.length));
    } else if(name[0] == ".") { // it's a part
      let part_name = name.slice(1, name.length);
      if(this.component.findPart(part_name))
        return part_name; // Returning string here, because we're going to use behave("hide/showPart"), which accepts a string.
    } else { // we don't know
      let part = this._findEntity("." + name);
      if(part == null)
        return this._findEntity("#" + name);
      else
        return part;
    }
  }

  _processStateTransition(t) { return string_to_array_or_object(t) };

  _applyBehaviorToEntities(action, entities, { animation_speed=null }={}) {
    if(entities.length == 0) return;

    if(animation_speed == null)
      animation_speed = this.settings[action + "_animation_speed"];
    let promises = [];
    entities.forEach(entity_name => {
      let entity = this._findEntity(entity_name);
      if(typeof entity === "string")
        promises.push(this.component.behave(`${action}Part`, [entity, animation_speed]));
      else if(entity != null)
        entity.forEach(c => promises.push(c.behave(action, [animation_speed])));
    });

    return Promise.all(promises);
  }

  _extractDisplayStateEntities() {
    var entities = [];
    this.states.forEach(declaration => {
      entities = entities.concat(this._processStateTransition(declaration[1]));
    });
    return [...new Set(entities)];
  }

  /* The purpose of this method is to always attempt to apply the latest transitions, ignoring
   * all the previous changes whose line in the queue may not have yet come. In fact, there's no queue.
   * This method is unique to DisplayStateManager because other state managers may want to run
   * all of the code assigned to every state that we pass through. However DisplayStateManager
   * doesn't want to bother the user with constant screen blinking if states change very fast -
   * that is if the component enters one state before the transition to the previous one has even started
   * executing.
   *
   * Example:
   *
   * Say there are 3 state changes: (a) is already being animated, (b) is sitting waiting its turn in
   * `this.last_state_change` property and (c) was just initiated and applyTransitions() just called for it.
   * In this case (b) will be comletely ingored, as applyTransitions() will rewrite `this.last_state_change`
   * and put (c) into it. Therefore, after the animation for (a) is completed, DisplayStateManager will get
   * straight to executing (c) animations. This is because there's no point in animating (b) because the state
   * had already changed since then.
   */
  _applyLatestTransition() {
    if(this.queue.length == 0) return;
    var queue_item = this.queue[this.queue.length-1];
    var self = this;
    Promise.all([
      this._applyBehaviorToEntities(this.settings.default_state_clear_action, queue_item.display_state[0]),
      this._applyBehaviorToEntities(this.settings.default_state_action, queue_item.display_state[1])
    ]).then(() => {
      var queue_item_index = self.queue.findIndex((i) => i == queue_item);
      var old_queue_items  = self.queue.slice(0, queue_item_index);
      var new_queue_items  = self.queue.slice(queue_item_index+1, self.queue.length);

      old_queue_items.forEach((i) => i.transition_promise.reject());
      queue_item.transition_promise.resolve();
      self.queue = new_queue_items;
      self._applyLatestTransition();
    });
  }

}
