import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import {
  BatchedInsightExceptionEngine,
  defaultBatchedInsightExceptionEngine,
} from "./batched-insight-exception-engine.js";
import {
  BatchedInsightExceptionValidator,
  defaultBatchedInsightExceptionValidator,
} from "./batched-insight-exception-rules.js";
import { BatchedInsightExceptionStore } from "./batched-insight-exception-store.js";

/** Moves batched insight exceptions through their life cycle and keeps a journal of what it did. */
export class BatchedInsightExceptionManager {
  store: BatchedInsightExceptionStore;
  validator: BatchedInsightExceptionValidator;
  clock: clock.Clock;
  journal: string[];
  engine: BatchedInsightExceptionEngine;

  constructor(
    store: BatchedInsightExceptionStore,
    validator: BatchedInsightExceptionValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: BatchedInsightExceptionEngine,
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
      throw new Error(`batched insight exception ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("in_review");
    this.store.save(item);
    this.note(`${code} is in review`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`batched insight exception ${code} not found`);
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
      throw new Error(`batched insight exception ${code} not found`);
    }
    const result = this.engine.run(item);
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

export function newBatchedInsightExceptionManager(store: BatchedInsightExceptionStore, clockValue: clock.Clock, flagsValue: flags.Registry): BatchedInsightExceptionManager {
  return new BatchedInsightExceptionManager(
    store,
    defaultBatchedInsightExceptionValidator(),
    clockValue,
    [],
    defaultBatchedInsightExceptionEngine(flagsValue),
  );
}
