import * as clock from "../../../../kit/clock.js";
import { BatchedCohortOverrideEngine, defaultBatchedCohortOverrideEngine } from "./batched-cohort-override-engine.js";
import {
  BatchedCohortOverrideValidator,
  defaultBatchedCohortOverrideValidator,
} from "./batched-cohort-override-rules.js";
import { BatchedCohortOverrideStore } from "./batched-cohort-override-store.js";

/** Moves batched cohort overrides through their life cycle and keeps a journal of what it did. */
export class BatchedCohortOverrideDesk {
  store: BatchedCohortOverrideStore;
  validator: BatchedCohortOverrideValidator;
  clock: clock.Clock;
  journal: string[];
  engine: BatchedCohortOverrideEngine;

  constructor(
    store: BatchedCohortOverrideStore,
    validator: BatchedCohortOverrideValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: BatchedCohortOverrideEngine,
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
      throw new Error(`batched cohort override ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("in_review");
    this.store.save(item);
    this.note(`${code} is in review`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`batched cohort override ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("archived");
    this.store.save(item);
    this.note(`${code} is archived: ${reason}`);
  }

  evaluate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`batched cohort override ${code} not found`);
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

export function newBatchedCohortOverrideDesk(store: BatchedCohortOverrideStore, clockValue: clock.Clock): BatchedCohortOverrideDesk {
  return new BatchedCohortOverrideDesk(
    store,
    defaultBatchedCohortOverrideValidator(),
    clockValue,
    [],
    defaultBatchedCohortOverrideEngine(),
  );
}
