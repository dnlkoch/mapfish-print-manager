/**
 * The ObservableEvent.
 */
export class ObservableEvent {

  /**
   * The name of the event.
   *
   * @type {String}
   */
  eventName = '';

  /**
   * The callback functions of the event.
   *
   * @type {Array}
   */
  callbacks = [];

  /**
   * The constructor.
   */
  constructor(eventName) {
    this.eventName = eventName;
  }

  /**
   * Registers a callback to this ObservableEvent.
   *
   * @param {Function} callback The callback function to register.
   */
  registerCallback(callback) {
    this.callbacks.push(callback);
  }

  /**
   * Unregisters a callback of this ObservableEvent.
   *
   * @param {Function} callback The callback to unregister.
   */
  unregisterCallback(callback) {
    const index = this.callbacks.indexOf(callback);
    if (index > -1) {
      this.callbacks.splice(index, 1);
    }
  }

  /**
   * Calls all given callbacks of the event with the provided data.
   *
   * @param {Object} data The data to call the callback(s) with.
   */
  fire(data) {
    const callbacks = this.callbacks.slice(0);
    callbacks.forEach(callback => {
      callback(data);
    });
  }
}

export default ObservableEvent;
