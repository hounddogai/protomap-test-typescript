import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import {
  CappedEnrollmentReviewEngine,
  defaultCappedEnrollmentReviewEngine,
} from "./capped-enrollment-review-engine.js";
import {
  CappedEnrollmentReviewValidator,
  defaultCappedEnrollmentReviewValidator,
} from "./capped-enrollment-review-rules.js";
import { CappedEnrollmentReviewStore } from "./capped-enrollment-review-store.js";

/** Moves capped enrollment reviews through their life cycle and keeps a journal of what it did. */
export class CappedEnrollmentReviewWorkflow {
  store: CappedEnrollmentReviewStore;
  validator: CappedEnrollmentReviewValidator;
  clock: clock.Clock;
  journal: string[];
  engine: CappedEnrollmentReviewEngine;

  constructor(
    store: CappedEnrollmentReviewStore,
    validator: CappedEnrollmentReviewValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: CappedEnrollmentReviewEngine,
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
      throw new Error(`capped enrollment review ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("in_review");
    this.store.save(item);
    this.note(`${code} is in review`);
  }

  finish(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`capped enrollment review ${code} not found`);
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
      throw new Error(`capped enrollment review ${code} not found`);
    }
    const result = this.engine.price(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  reviewStale(cutoff: number): number {
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

export function newCappedEnrollmentReviewWorkflow(store: CappedEnrollmentReviewStore, clockValue: clock.Clock, flagsValue: flags.Registry): CappedEnrollmentReviewWorkflow {
  return new CappedEnrollmentReviewWorkflow(
    store,
    defaultCappedEnrollmentReviewValidator(),
    clockValue,
    [],
    defaultCappedEnrollmentReviewEngine(flagsValue),
  );
}
