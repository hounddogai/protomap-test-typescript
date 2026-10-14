import * as clock from "../../../../kit/clock.js";
import { EnrollmentProfileEngine, defaultEnrollmentProfileEngine } from "./enrollment-profile-engine.js";
import { EnrollmentProfileValidator, defaultEnrollmentProfileValidator } from "./enrollment-profile-rules.js";
import { EnrollmentProfileStore } from "./enrollment-profile-store.js";

/** Moves enrollment profiles through their life cycle and keeps a journal of what it did. */
export class EnrollmentProfileCoordinator {
  store: EnrollmentProfileStore;
  validator: EnrollmentProfileValidator;
  clock: clock.Clock;
  journal: string[];
  engine: EnrollmentProfileEngine;

  constructor(
    store: EnrollmentProfileStore,
    validator: EnrollmentProfileValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: EnrollmentProfileEngine,
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
      throw new Error(`enrollment profile ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("scheduled");
    this.store.save(item);
    this.note(`${code} is scheduled`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`enrollment profile ${code} not found`);
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
      throw new Error(`enrollment profile ${code} not found`);
    }
    const result = this.engine.compute(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  audit(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.updatedAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newEnrollmentProfileCoordinator(store: EnrollmentProfileStore, clockValue: clock.Clock): EnrollmentProfileCoordinator {
  return new EnrollmentProfileCoordinator(
    store,
    defaultEnrollmentProfileValidator(),
    clockValue,
    [],
    defaultEnrollmentProfileEngine(),
  );
}
