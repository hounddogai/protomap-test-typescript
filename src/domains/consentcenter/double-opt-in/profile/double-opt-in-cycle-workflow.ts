import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { DoubleOptInCycleEngine, defaultDoubleOptInCycleEngine } from "./double-opt-in-cycle-engine.js";
import { DoubleOptInCycleValidator, defaultDoubleOptInCycleValidator } from "./double-opt-in-cycle-rules.js";
import { DoubleOptInCycleStore } from "./double-opt-in-cycle-store.js";

/** Moves double opt in cycles through their life cycle and keeps a journal of what it did. */
export class DoubleOptInCycleWorkflow {
  store: DoubleOptInCycleStore;
  validator: DoubleOptInCycleValidator;
  clock: clock.Clock;
  journal: string[];
  engine: DoubleOptInCycleEngine;

  constructor(
    store: DoubleOptInCycleStore,
    validator: DoubleOptInCycleValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: DoubleOptInCycleEngine,
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

  start(code: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`double opt in cycle ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("approved");
    this.store.save(item);
    this.note(`${code} is approved`);
  }

  finish(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`double opt in cycle ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("withdrawn");
    this.store.save(item);
    this.note(`${code} is withdrawn: ${reason}`);
  }

  quote(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`double opt in cycle ${code} not found`);
    }
    const result = this.engine.compute(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  scan(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.startsAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newDoubleOptInCycleWorkflow(store: DoubleOptInCycleStore, clockValue: clock.Clock, flagsValue: flags.Registry): DoubleOptInCycleWorkflow {
  return new DoubleOptInCycleWorkflow(
    store,
    defaultDoubleOptInCycleValidator(),
    clockValue,
    [],
    defaultDoubleOptInCycleEngine(flagsValue),
  );
}
