import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { BatchedLevelEstimateEngine, defaultBatchedLevelEstimateEngine } from "./batched-level-estimate-engine.js";
import {
  BatchedLevelEstimateValidator,
  defaultBatchedLevelEstimateValidator,
} from "./batched-level-estimate-rules.js";
import { BatchedLevelEstimateStore } from "./batched-level-estimate-store.js";

/** Moves batched level estimates through their life cycle and keeps a journal of what it did. */
export class BatchedLevelEstimateWorkflow {
  store: BatchedLevelEstimateStore;
  validator: BatchedLevelEstimateValidator;
  clock: clock.Clock;
  journal: string[];
  engine: BatchedLevelEstimateEngine;

  constructor(
    store: BatchedLevelEstimateStore,
    validator: BatchedLevelEstimateValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: BatchedLevelEstimateEngine,
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
      throw new Error(`batched level estimate ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("in_review");
    this.store.save(item);
    this.note(`${code} is in review`);
  }

  close(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`batched level estimate ${code} not found`);
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
      throw new Error(`batched level estimate ${code} not found`);
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

export function newBatchedLevelEstimateWorkflow(store: BatchedLevelEstimateStore, clockValue: clock.Clock, flagsValue: flags.Registry): BatchedLevelEstimateWorkflow {
  return new BatchedLevelEstimateWorkflow(
    store,
    defaultBatchedLevelEstimateValidator(),
    clockValue,
    [],
    defaultBatchedLevelEstimateEngine(flagsValue),
  );
}
