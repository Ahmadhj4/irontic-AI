// Lightweight EventEmitter — replaces eventemitter3
type Listener = (...args: unknown[]) => void;

export class EventEmitter {
  private _events: Map<string, Listener[]> = new Map();

  on(event: string, listener: Listener): this {
    const listeners = this._events.get(event) ?? [];
    this._events.set(event, [...listeners, listener]);
    return this;
  }

  off(event: string, listener: Listener): this {
    const listeners = this._events.get(event) ?? [];
    this._events.set(event, listeners.filter(l => l !== listener));
    return this;
  }

  emit(event: string, ...args: unknown[]): boolean {
    const listeners = this._events.get(event);
    if (!listeners || listeners.length === 0) return false;
    listeners.forEach(l => l(...args));
    return true;
  }

  once(event: string, listener: Listener): this {
    const wrapper: Listener = (...args) => {
      listener(...args);
      this.off(event, wrapper);
    };
    return this.on(event, wrapper);
  }

  removeAllListeners(event?: string): this {
    if (event) this._events.delete(event);
    else this._events.clear();
    return this;
  }
}

export default EventEmitter;
