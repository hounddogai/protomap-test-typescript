import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { EnrollmentVarianceEngine, defaultEnrollmentVarianceEngine } from "./enrollment-variance-engine.js";
import { EnrollmentVarianceValidator, defaultEnrollmentVarianceValidator } from "./enrollment-variance-rules.js";
import { EnrollmentVarianceStore } from "./enrollment-variance-store.js";

/** Moves enrollment variances through their life cycle and keeps a journal of what it did. */
export class EnrollmentVarianceCoordinator {
  store: EnrollmentVarianceStore;
  validator: EnrollmentVarianceValidator;
  clock: clock.Clock;
  journal: string[];
  engine: EnrollmentVarianceEngine;

  constructor(
    store: EnrollmentVarianceStore,
    validator: EnrollmentVarianceValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: EnrollmentVarianceEngine,
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
      throw new Error(`enrollment variance ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("granted");
    this.store.save(item);
    this.note(`${code} is granted`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`enrollment variance ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("expired");
    this.store.save(item);
    this.note(`${code} is expired: ${reason}`);
  }

  score(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`enrollment variance ${code} not found`);
    }
    const result = this.engine.price(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  scan(cutoff: number): number {
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

export function newEnrollmentVarianceCoordinator(store: EnrollmentVarianceStore, clockValue: clock.Clock, flagsValue: flags.Registry): EnrollmentVarianceCoordinator {
  return new EnrollmentVarianceCoordinator(
    store,
    defaultEnrollmentVarianceValidator(),
    clockValue,
    [],
    defaultEnrollmentVarianceEngine(flagsValue),
  );
}
