import * as clock from "../../../../kit/clock.js";
import {
  BatchedDoubleOptInReviewEngine,
  defaultBatchedDoubleOptInReviewEngine,
} from "./batched-double-opt-in-review-engine.js";
import {
  BatchedDoubleOptInReviewValidator,
  defaultBatchedDoubleOptInReviewValidator,
} from "./batched-double-opt-in-review-rules.js";
import { BatchedDoubleOptInReviewStore } from "./batched-double-opt-in-review-store.js";

/** Moves batched double opt in reviews through their life cycle and keeps a journal of what it did. */
export class BatchedDoubleOptInReviewCoordinator {
  store: BatchedDoubleOptInReviewStore;
  validator: BatchedDoubleOptInReviewValidator;
  clock: clock.Clock;
  journal: string[];
  engine: BatchedDoubleOptInReviewEngine;

  constructor(
    store: BatchedDoubleOptInReviewStore,
    validator: BatchedDoubleOptInReviewValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: BatchedDoubleOptInReviewEngine,
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
      throw new Error(`batched double opt in review ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("granted");
    this.store.save(item);
    this.note(`${code} is granted`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`batched double opt in review ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("expired");
    this.store.save(item);
    this.note(`${code} is expired: ${reason}`);
  }

  quote(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`batched double opt in review ${code} not found`);
    }
    const result = this.engine.compute(item);
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

export function newBatchedDoubleOptInReviewCoordinator(store: BatchedDoubleOptInReviewStore, clockValue: clock.Clock): BatchedDoubleOptInReviewCoordinator {
  return new BatchedDoubleOptInReviewCoordinator(
    store,
    defaultBatchedDoubleOptInReviewValidator(),
    clockValue,
    [],
    defaultBatchedDoubleOptInReviewEngine(),
  );
}
