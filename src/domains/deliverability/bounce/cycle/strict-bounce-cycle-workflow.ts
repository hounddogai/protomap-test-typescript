import * as clock from "../../../../kit/clock.js";
import { StrictBounceCycleEngine, defaultStrictBounceCycleEngine } from "./strict-bounce-cycle-engine.js";
import { StrictBounceCycleValidator, defaultStrictBounceCycleValidator } from "./strict-bounce-cycle-rules.js";
import { StrictBounceCycleStore } from "./strict-bounce-cycle-store.js";

/** Moves strict bounce cycles through their life cycle and keeps a journal of what it did. */
export class StrictBounceCycleManager {
  store: StrictBounceCycleStore;
  validator: StrictBounceCycleValidator;
  clock: clock.Clock;
  journal: string[];
  engine: StrictBounceCycleEngine;

  constructor(
    store: StrictBounceCycleStore,
    validator: StrictBounceCycleValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: StrictBounceCycleEngine,
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

  submit(code: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`strict bounce cycle ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("scheduled");
    this.store.save(item);
    this.note(`${code} is scheduled`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`strict bounce cycle ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("cancelled");
    this.store.save(item);
    this.note(`${code} is cancelled: ${reason}`);
  }

  estimate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`strict bounce cycle ${code} not found`);
    }
    const result = this.engine.evaluate(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  sweep(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.endsAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newStrictBounceCycleManager(store: StrictBounceCycleStore, clockValue: clock.Clock): StrictBounceCycleManager {
  return new StrictBounceCycleManager(
    store,
    defaultStrictBounceCycleValidator(),
    clockValue,
    [],
    defaultStrictBounceCycleEngine(),
  );
}
