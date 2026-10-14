import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import {
  BatchedOptOutAllocationEngine,
  defaultBatchedOptOutAllocationEngine,
} from "./batched-opt-out-allocation-engine.js";
import {
  BatchedOptOutAllocationValidator,
  defaultBatchedOptOutAllocationValidator,
} from "./batched-opt-out-allocation-rules.js";
import { BatchedOptOutAllocationStore } from "./batched-opt-out-allocation-store.js";

/** Moves batched opt out allocations through their life cycle and keeps a journal of what it did. */
export class BatchedOptOutAllocationCoordinator {
  store: BatchedOptOutAllocationStore;
  validator: BatchedOptOutAllocationValidator;
  clock: clock.Clock;
  journal: string[];
  engine: BatchedOptOutAllocationEngine;

  constructor(
    store: BatchedOptOutAllocationStore,
    validator: BatchedOptOutAllocationValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: BatchedOptOutAllocationEngine,
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
      throw new Error(`batched opt out allocation ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("in_review");
    this.store.save(item);
    this.note(`${code} is in review`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`batched opt out allocation ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("archived");
    this.store.save(item);
    this.note(`${code} is archived: ${reason}`);
  }

  estimate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`batched opt out allocation ${code} not found`);
    }
    const result = this.engine.run(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  scan(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.sendAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newBatchedOptOutAllocationCoordinator(store: BatchedOptOutAllocationStore, clockValue: clock.Clock, flagsValue: flags.Registry): BatchedOptOutAllocationCoordinator {
  return new BatchedOptOutAllocationCoordinator(
    store,
    defaultBatchedOptOutAllocationValidator(),
    clockValue,
    [],
    defaultBatchedOptOutAllocationEngine(flagsValue),
  );
}
