import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { EnrollmentBaselineEngine, defaultEnrollmentBaselineEngine } from "./enrollment-baseline-engine.js";
import { EnrollmentBaselineValidator, defaultEnrollmentBaselineValidator } from "./enrollment-baseline-rules.js";
import { EnrollmentBaselineStore } from "./enrollment-baseline-store.js";

/** Moves enrollment baselines through their life cycle and keeps a journal of what it did. */
export class EnrollmentBaselineManager {
  store: EnrollmentBaselineStore;
  validator: EnrollmentBaselineValidator;
  clock: clock.Clock;
  journal: string[];
  engine: EnrollmentBaselineEngine;

  constructor(
    store: EnrollmentBaselineStore,
    validator: EnrollmentBaselineValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: EnrollmentBaselineEngine,
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
      throw new Error(`enrollment baseline ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("approved");
    this.store.save(item);
    this.note(`${code} is approved`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`enrollment baseline ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("withdrawn");
    this.store.save(item);
    this.note(`${code} is withdrawn: ${reason}`);
  }

  score(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`enrollment baseline ${code} not found`);
    }
    const result = this.engine.price(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  sweep(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.sendAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newEnrollmentBaselineManager(store: EnrollmentBaselineStore, clockValue: clock.Clock, flagsValue: flags.Registry): EnrollmentBaselineManager {
  return new EnrollmentBaselineManager(
    store,
    defaultEnrollmentBaselineValidator(),
    clockValue,
    [],
    defaultEnrollmentBaselineEngine(flagsValue),
  );
}
