import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import {
  BatchedActivationBatchEngine,
  defaultBatchedActivationBatchEngine,
} from "./batched-activation-batch-engine.js";
import {
  BatchedActivationBatchValidator,
  defaultBatchedActivationBatchValidator,
} from "./batched-activation-batch-rules.js";
import { BatchedActivationBatchStore } from "./batched-activation-batch-store.js";

/** Moves batched activation batches through their life cycle and keeps a journal of what it did. */
export class BatchedActivationBatchManager {
  store: BatchedActivationBatchStore;
  validator: BatchedActivationBatchValidator;
  clock: clock.Clock;
  journal: string[];
  engine: BatchedActivationBatchEngine;

  constructor(
    store: BatchedActivationBatchStore,
    validator: BatchedActivationBatchValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: BatchedActivationBatchEngine,
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
      throw new Error(`batched activation batch ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("approved");
    this.store.save(item);
    this.note(`${code} is approved`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`batched activation batch ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("withdrawn");
    this.store.save(item);
    this.note(`${code} is withdrawn: ${reason}`);
  }

  quote(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`batched activation batch ${code} not found`);
    }
    const result = this.engine.evaluate(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
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

export function newBatchedActivationBatchManager(store: BatchedActivationBatchStore, clockValue: clock.Clock, flagsValue: flags.Registry): BatchedActivationBatchManager {
  return new BatchedActivationBatchManager(
    store,
    defaultBatchedActivationBatchValidator(),
    clockValue,
    [],
    defaultBatchedActivationBatchEngine(flagsValue),
  );
}
