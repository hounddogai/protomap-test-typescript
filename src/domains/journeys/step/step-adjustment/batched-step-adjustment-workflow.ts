import * as clock from "../../../../kit/clock.js";
import { BatchedStepAdjustmentEngine, defaultBatchedStepAdjustmentEngine } from "./batched-step-adjustment-engine.js";
import {
  BatchedStepAdjustmentValidator,
  defaultBatchedStepAdjustmentValidator,
} from "./batched-step-adjustment-rules.js";
import { BatchedStepAdjustmentStore } from "./batched-step-adjustment-store.js";

/** Moves batched step adjustments through their life cycle and keeps a journal of what it did. */
export class BatchedStepAdjustmentDesk {
  store: BatchedStepAdjustmentStore;
  validator: BatchedStepAdjustmentValidator;
  clock: clock.Clock;
  journal: string[];
  engine: BatchedStepAdjustmentEngine;

  constructor(
    store: BatchedStepAdjustmentStore,
    validator: BatchedStepAdjustmentValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: BatchedStepAdjustmentEngine,
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
      throw new Error(`batched step adjustment ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("pending");
    this.store.save(item);
    this.note(`${code} is pending`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`batched step adjustment ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("closed");
    this.store.save(item);
    this.note(`${code} is closed: ${reason}`);
  }

  evaluate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`batched step adjustment ${code} not found`);
    }
    const result = this.engine.evaluate(item);
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

export function newBatchedStepAdjustmentDesk(store: BatchedStepAdjustmentStore, clockValue: clock.Clock): BatchedStepAdjustmentDesk {
  return new BatchedStepAdjustmentDesk(
    store,
    defaultBatchedStepAdjustmentValidator(),
    clockValue,
    [],
    defaultBatchedStepAdjustmentEngine(),
  );
}
