import * as clock from "../../../../kit/clock.js";
import {
  BatchedComplaintWindowEngine,
  defaultBatchedComplaintWindowEngine,
} from "./batched-complaint-window-engine.js";
import {
  BatchedComplaintWindowValidator,
  defaultBatchedComplaintWindowValidator,
} from "./batched-complaint-window-rules.js";
import { BatchedComplaintWindowStore } from "./batched-complaint-window-store.js";

/** Moves batched complaint windows through their life cycle and keeps a journal of what it did. */
export class BatchedComplaintWindowManager {
  store: BatchedComplaintWindowStore;
  validator: BatchedComplaintWindowValidator;
  clock: clock.Clock;
  journal: string[];
  engine: BatchedComplaintWindowEngine;

  constructor(
    store: BatchedComplaintWindowStore,
    validator: BatchedComplaintWindowValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: BatchedComplaintWindowEngine,
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
      throw new Error(`batched complaint window ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("pending");
    this.store.save(item);
    this.note(`${code} is pending`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`batched complaint window ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("closed");
    this.store.save(item);
    this.note(`${code} is closed: ${reason}`);
  }

  quote(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`batched complaint window ${code} not found`);
    }
    const result = this.engine.compute(item);
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

export function newBatchedComplaintWindowManager(store: BatchedComplaintWindowStore, clockValue: clock.Clock): BatchedComplaintWindowManager {
  return new BatchedComplaintWindowManager(
    store,
    defaultBatchedComplaintWindowValidator(),
    clockValue,
    [],
    defaultBatchedComplaintWindowEngine(),
  );
}
