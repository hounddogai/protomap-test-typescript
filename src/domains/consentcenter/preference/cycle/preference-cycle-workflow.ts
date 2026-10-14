import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { PreferenceCycleEngine, defaultPreferenceCycleEngine } from "./preference-cycle-engine.js";
import { PreferenceCycleValidator, defaultPreferenceCycleValidator } from "./preference-cycle-rules.js";
import { PreferenceCycleStore } from "./preference-cycle-store.js";

/** Moves preference cycles through their life cycle and keeps a journal of what it did. */
export class PreferenceCycleWorkflow {
  store: PreferenceCycleStore;
  validator: PreferenceCycleValidator;
  clock: clock.Clock;
  journal: string[];
  engine: PreferenceCycleEngine;

  constructor(
    store: PreferenceCycleStore,
    validator: PreferenceCycleValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: PreferenceCycleEngine,
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
      throw new Error(`preference cycle ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("pending");
    this.store.save(item);
    this.note(`${code} is pending`);
  }

  finish(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`preference cycle ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("closed");
    this.store.save(item);
    this.note(`${code} is closed: ${reason}`);
  }

  score(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`preference cycle ${code} not found`);
    }
    const result = this.engine.evaluate(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  scan(cutoff: number): number {
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

export function newPreferenceCycleWorkflow(store: PreferenceCycleStore, clockValue: clock.Clock, flagsValue: flags.Registry): PreferenceCycleWorkflow {
  return new PreferenceCycleWorkflow(
    store,
    defaultPreferenceCycleValidator(),
    clockValue,
    [],
    defaultPreferenceCycleEngine(flagsValue),
  );
}
