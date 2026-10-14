import * as clock from "../../../../kit/clock.js";
import {
  BatchedCohortAllocationEngine,
  defaultBatchedCohortAllocationEngine,
} from "./batched-cohort-allocation-engine.js";
import {
  BatchedCohortAllocationValidator,
  defaultBatchedCohortAllocationValidator,
} from "./batched-cohort-allocation-rules.js";
import { BatchedCohortAllocationStore } from "./batched-cohort-allocation-store.js";

/** Moves batched cohort allocations through their life cycle and keeps a journal of what it did. */
export class BatchedCohortAllocationWorkflow {
  store: BatchedCohortAllocationStore;
  validator: BatchedCohortAllocationValidator;
  clock: clock.Clock;
  journal: string[];
  engine: BatchedCohortAllocationEngine;

  constructor(
    store: BatchedCohortAllocationStore,
    validator: BatchedCohortAllocationValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: BatchedCohortAllocationEngine,
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
      throw new Error(`batched cohort allocation ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("queued");
    this.store.save(item);
    this.note(`${code} is queued`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`batched cohort allocation ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("failed");
    this.store.save(item);
    this.note(`${code} is failed: ${reason}`);
  }

  quote(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`batched cohort allocation ${code} not found`);
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

export function newBatchedCohortAllocationWorkflow(store: BatchedCohortAllocationStore, clockValue: clock.Clock): BatchedCohortAllocationWorkflow {
  return new BatchedCohortAllocationWorkflow(
    store,
    defaultBatchedCohortAllocationValidator(),
    clockValue,
    [],
    defaultBatchedCohortAllocationEngine(),
  );
}
