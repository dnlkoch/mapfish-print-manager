import ObservableEvent from './ObservableEvent';

/**
 * The Observable.
 */
export class Observable {

  /**
   * The registered events.
   *
   * @type {Object}
   */
  events = {};

  /**
  * Registers an event.
  *
  * @param {String} name The name of the event to register.
  * @param {Function} callback The callback function to register.
  */
  on(name, callback) {
    let event = this.events[name];
    if (!event) {
      event = new ObservableEvent(name);
      this.events[name] = event;
    }
    event.registerCallback(callback);
  }

  /**
  * Unregisters an event.
  *
  * @param {String} name The name of the event to unregister.
  * @param {Function} callback The callback function to unregister.
  */
  un(name, callback) {
    const event = this.events[name];
    if (event && event.callbacks.indexOf(callback) > -1) {
      event.unregisterCallback(callback);
      if (event.callbacks.length === 0) {
        delete this.events[name];
      }
    }
  }

  /**
   * Dispatches the given event with the provided data.
   *
   * @param {String} name The name of the event to dispatch.
   * @param {Object} data The data to apply to the event callback.
   */
  dispatch(name, data) {
    const event = this.events[name];
    if (event) {
      event.fire(data);
    }
  }

}

export default Observable;
