import * as clock from "../../../../kit/clock.js";
import {
  BatchedOptOutBaselineValidator,
  defaultBatchedOptOutBaselineValidator,
} from "./batched-opt-out-baseline-rules.js";
import { BatchedOptOutBaselineStore } from "./batched-opt-out-baseline-store.js";

/** Moves batched opt out baselines through their life cycle and keeps a journal of what it did. */
export class BatchedOptOutBaselineCoordinator {
  store: BatchedOptOutBaselineStore;
  validator: BatchedOptOutBaselineValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: BatchedOptOutBaselineStore,
    validator: BatchedOptOutBaselineValidator,
    clockValue: clock.Clock,
    journal: string[],
  ) {
    this.store = store;
    this.validator = validator;
    this.clock = clockValue;
    this.journal = journal;
  }

  private note(message: string): void {
    this.journal.push(`${this.clock.now()} ${message}`);
  }

  start(code: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`batched opt out baseline ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("queued");
    this.store.save(item);
    this.note(`${code} is queued`);
  }

  finish(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`batched opt out baseline ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("failed");
    this.store.save(item);
    this.note(`${code} is failed: ${reason}`);
  }

  sweep(cutoff: number): number {
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

export function newBatchedOptOutBaselineCoordinator(store: BatchedOptOutBaselineStore, clockValue: clock.Clock): BatchedOptOutBaselineCoordinator {
  return new BatchedOptOutBaselineCoordinator(store, defaultBatchedOptOutBaselineValidator(), clockValue, []);
}
