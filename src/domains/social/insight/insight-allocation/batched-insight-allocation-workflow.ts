import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import {
  BatchedInsightAllocationEngine,
  defaultBatchedInsightAllocationEngine,
} from "./batched-insight-allocation-engine.js";
import {
  BatchedInsightAllocationValidator,
  defaultBatchedInsightAllocationValidator,
} from "./batched-insight-allocation-rules.js";
import { BatchedInsightAllocationStore } from "./batched-insight-allocation-store.js";

/** Moves batched insight allocations through their life cycle and keeps a journal of what it did. */
export class BatchedInsightAllocationManager {
  store: BatchedInsightAllocationStore;
  validator: BatchedInsightAllocationValidator;
  clock: clock.Clock;
  journal: string[];
  engine: BatchedInsightAllocationEngine;

  constructor(
    store: BatchedInsightAllocationStore,
    validator: BatchedInsightAllocationValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: BatchedInsightAllocationEngine,
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
      throw new Error(`batched insight allocation ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("granted");
    this.store.save(item);
    this.note(`${code} is granted`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`batched insight allocation ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("expired");
    this.store.save(item);
    this.note(`${code} is expired: ${reason}`);
  }

  estimate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`batched insight allocation ${code} not found`);
    }
    const result = this.engine.compute(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  audit(cutoff: number): number {
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

export function newBatchedInsightAllocationManager(store: BatchedInsightAllocationStore, clockValue: clock.Clock, flagsValue: flags.Registry): BatchedInsightAllocationManager {
  return new BatchedInsightAllocationManager(
    store,
    defaultBatchedInsightAllocationValidator(),
    clockValue,
    [],
    defaultBatchedInsightAllocationEngine(flagsValue),
  );
}
