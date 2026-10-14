import * as clock from "../../../../kit/clock.js";
import { EnrollmentDigestEngine, defaultEnrollmentDigestEngine } from "./enrollment-digest-engine.js";
import { EnrollmentDigestValidator, defaultEnrollmentDigestValidator } from "./enrollment-digest-rules.js";
import { EnrollmentDigestStore } from "./enrollment-digest-store.js";

/** Moves enrollment digests through their life cycle and keeps a journal of what it did. */
export class EnrollmentDigestDesk {
  store: EnrollmentDigestStore;
  validator: EnrollmentDigestValidator;
  clock: clock.Clock;
  journal: string[];
  engine: EnrollmentDigestEngine;

  constructor(
    store: EnrollmentDigestStore,
    validator: EnrollmentDigestValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: EnrollmentDigestEngine,
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
      throw new Error(`enrollment digest ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("approved");
    this.store.save(item);
    this.note(`${code} is approved`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`enrollment digest ${code} not found`);
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
      throw new Error(`enrollment digest ${code} not found`);
    }
    const result = this.engine.price(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  sweep(cutoff: number): number {
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

export function newEnrollmentDigestDesk(store: EnrollmentDigestStore, clockValue: clock.Clock): EnrollmentDigestDesk {
  return new EnrollmentDigestDesk(
    store,
    defaultEnrollmentDigestValidator(),
    clockValue,
    [],
    defaultEnrollmentDigestEngine(),
  );
}
