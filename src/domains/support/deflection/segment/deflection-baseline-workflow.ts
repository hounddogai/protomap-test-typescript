import * as clock from "../../../../kit/clock.js";
import { DeflectionBaselineEngine, defaultDeflectionBaselineEngine } from "./deflection-baseline-engine.js";
import { DeflectionBaselineValidator, defaultDeflectionBaselineValidator } from "./deflection-baseline-rules.js";
import { DeflectionBaselineStore } from "./deflection-baseline-store.js";

/** Moves deflection baselines through their life cycle and keeps a journal of what it did. */
export class DeflectionBaselineService {
  store: DeflectionBaselineStore;
  validator: DeflectionBaselineValidator;
  clock: clock.Clock;
  journal: string[];
  engine: DeflectionBaselineEngine;

  constructor(
    store: DeflectionBaselineStore,
    validator: DeflectionBaselineValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: DeflectionBaselineEngine,
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
      throw new Error(`deflection baseline ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("in_review");
    this.store.save(item);
    this.note(`${code} is in review`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`deflection baseline ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("archived");
    this.store.save(item);
    this.note(`${code} is archived: ${reason}`);
  }

  score(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`deflection baseline ${code} not found`);
    }
    const result = this.engine.run(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  audit(cutoff: number): number {
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

export function newDeflectionBaselineService(store: DeflectionBaselineStore, clockValue: clock.Clock): DeflectionBaselineService {
  return new DeflectionBaselineService(
    store,
    defaultDeflectionBaselineValidator(),
    clockValue,
    [],
    defaultDeflectionBaselineEngine(),
  );
}
