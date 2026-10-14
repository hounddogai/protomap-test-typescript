import * as clock from "../../../../kit/clock.js";
import { EnrollmentTierEngine, defaultEnrollmentTierEngine } from "./enrollment-tier-engine.js";
import { EnrollmentTierValidator, defaultEnrollmentTierValidator } from "./enrollment-tier-rules.js";
import { EnrollmentTierStore } from "./enrollment-tier-store.js";

/** Moves enrollment tiers through their life cycle and keeps a journal of what it did. */
export class EnrollmentTierService {
  store: EnrollmentTierStore;
  validator: EnrollmentTierValidator;
  clock: clock.Clock;
  journal: string[];
  engine: EnrollmentTierEngine;

  constructor(
    store: EnrollmentTierStore,
    validator: EnrollmentTierValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: EnrollmentTierEngine,
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
      throw new Error(`enrollment tier ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("approved");
    this.store.save(item);
    this.note(`${code} is approved`);
  }

  finish(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`enrollment tier ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("withdrawn");
    this.store.save(item);
    this.note(`${code} is withdrawn: ${reason}`);
  }

  estimate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`enrollment tier ${code} not found`);
    }
    const result = this.engine.price(item);
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

export function newEnrollmentTierService(store: EnrollmentTierStore, clockValue: clock.Clock): EnrollmentTierService {
  return new EnrollmentTierService(
    store,
    defaultEnrollmentTierValidator(),
    clockValue,
    [],
    defaultEnrollmentTierEngine(),
  );
}
