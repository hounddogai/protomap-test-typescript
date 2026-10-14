import * as clock from "../../../../kit/clock.js";
import {
  LegacyEnrollmentReviewEngine,
  defaultLegacyEnrollmentReviewEngine,
} from "./legacy-enrollment-review-engine.js";
import {
  LegacyEnrollmentReviewValidator,
  defaultLegacyEnrollmentReviewValidator,
} from "./legacy-enrollment-review-rules.js";
import { LegacyEnrollmentReviewStore } from "./legacy-enrollment-review-store.js";

/** Moves legacy enrollment reviews through their life cycle and keeps a journal of what it did. */
export class LegacyEnrollmentReviewManager {
  store: LegacyEnrollmentReviewStore;
  validator: LegacyEnrollmentReviewValidator;
  clock: clock.Clock;
  journal: string[];
  engine: LegacyEnrollmentReviewEngine;

  constructor(
    store: LegacyEnrollmentReviewStore,
    validator: LegacyEnrollmentReviewValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: LegacyEnrollmentReviewEngine,
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

  advance(code: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`legacy enrollment review ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("warming");
    this.store.save(item);
    this.note(`${code} is warming`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`legacy enrollment review ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("stopped");
    this.store.save(item);
    this.note(`${code} is stopped: ${reason}`);
  }

  estimate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`legacy enrollment review ${code} not found`);
    }
    const result = this.engine.price(item);
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

export function newLegacyEnrollmentReviewManager(store: LegacyEnrollmentReviewStore, clockValue: clock.Clock): LegacyEnrollmentReviewManager {
  return new LegacyEnrollmentReviewManager(
    store,
    defaultLegacyEnrollmentReviewValidator(),
    clockValue,
    [],
    defaultLegacyEnrollmentReviewEngine(),
  );
}
