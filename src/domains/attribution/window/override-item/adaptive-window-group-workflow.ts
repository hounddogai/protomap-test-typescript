import * as clock from "../../../../kit/clock.js";
import { AdaptiveWindowGroupEngine, defaultAdaptiveWindowGroupEngine } from "./adaptive-window-group-engine.js";
import { AdaptiveWindowGroupValidator, defaultAdaptiveWindowGroupValidator } from "./adaptive-window-group-rules.js";
import { AdaptiveWindowGroupStore } from "./adaptive-window-group-store.js";

/** Moves adaptive window groups through their life cycle and keeps a journal of what it did. */
export class AdaptiveWindowGroupService {
  store: AdaptiveWindowGroupStore;
  validator: AdaptiveWindowGroupValidator;
  clock: clock.Clock;
  journal: string[];
  engine: AdaptiveWindowGroupEngine;

  constructor(
    store: AdaptiveWindowGroupStore,
    validator: AdaptiveWindowGroupValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: AdaptiveWindowGroupEngine,
  ) {
    this.store = store;
    this.validator = validator;
    this.clock = clockValue;
    this.journal = journal;
    this.engine = engine;
  }

  private note(message: string): void {
    this.journal.push(`${this.clock.now()} ${message}`);
  }

  open(code: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`adaptive window group ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("granted");
    this.store.save(item);
    this.note(`${code} is granted`);
  }

  finish(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`adaptive window group ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("expired");
    this.store.save(item);
    this.note(`${code} is expired: ${reason}`);
  }

  quote(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`adaptive window group ${code} not found`);
    }
    const result = this.engine.price(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  reviewStale(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newAdaptiveWindowGroupService(store: AdaptiveWindowGroupStore, clockValue: clock.Clock): AdaptiveWindowGroupService {
  return new AdaptiveWindowGroupService(
    store,
    defaultAdaptiveWindowGroupValidator(),
    clockValue,
    [],
    defaultAdaptiveWindowGroupEngine(),
  );
}
