import * as clock from "../../../../kit/clock.js";
import { BatchedPostExceptionEngine, defaultBatchedPostExceptionEngine } from "./batched-post-exception-engine.js";
import {
  BatchedPostExceptionValidator,
  defaultBatchedPostExceptionValidator,
} from "./batched-post-exception-rules.js";
import { BatchedPostExceptionStore } from "./batched-post-exception-store.js";

/** Moves batched post exceptions through their life cycle and keeps a journal of what it did. */
export class BatchedPostExceptionService {
  store: BatchedPostExceptionStore;
  validator: BatchedPostExceptionValidator;
  clock: clock.Clock;
  journal: string[];
  engine: BatchedPostExceptionEngine;

  constructor(
    store: BatchedPostExceptionStore,
    validator: BatchedPostExceptionValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: BatchedPostExceptionEngine,
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
      throw new Error(`batched post exception ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("in_review");
    this.store.save(item);
    this.note(`${code} is in review`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`batched post exception ${code} not found`);
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
      throw new Error(`batched post exception ${code} not found`);
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

export function newBatchedPostExceptionService(store: BatchedPostExceptionStore, clockValue: clock.Clock): BatchedPostExceptionService {
  return new BatchedPostExceptionService(
    store,
    defaultBatchedPostExceptionValidator(),
    clockValue,
    [],
    defaultBatchedPostExceptionEngine(),
  );
}
