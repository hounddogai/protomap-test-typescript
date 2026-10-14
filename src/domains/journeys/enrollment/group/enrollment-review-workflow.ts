import * as clock from "../../../../kit/clock.js";
import { EnrollmentReviewEngine, defaultEnrollmentReviewEngine } from "./enrollment-review-engine.js";
import { EnrollmentReviewValidator, defaultEnrollmentReviewValidator } from "./enrollment-review-rules.js";
import { EnrollmentReviewStore } from "./enrollment-review-store.js";

/** Moves enrollment reviews through their life cycle and keeps a journal of what it did. */
export class EnrollmentReviewCoordinator {
  store: EnrollmentReviewStore;
  validator: EnrollmentReviewValidator;
  clock: clock.Clock;
  journal: string[];
  engine: EnrollmentReviewEngine;

  constructor(
    store: EnrollmentReviewStore,
    validator: EnrollmentReviewValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: EnrollmentReviewEngine,
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
      throw new Error(`enrollment review ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("approved");
    this.store.save(item);
    this.note(`${code} is approved`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`enrollment review ${code} not found`);
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
      throw new Error(`enrollment review ${code} not found`);
    }
    const result = this.engine.evaluate(item);
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

export function newEnrollmentReviewCoordinator(store: EnrollmentReviewStore, clockValue: clock.Clock): EnrollmentReviewCoordinator {
  return new EnrollmentReviewCoordinator(
    store,
    defaultEnrollmentReviewValidator(),
    clockValue,
    [],
    defaultEnrollmentReviewEngine(),
  );
}
