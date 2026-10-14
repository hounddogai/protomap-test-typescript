import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { BatchedSenderGroupEngine, defaultBatchedSenderGroupEngine } from "./batched-sender-group-engine.js";
import { BatchedSenderGroupValidator, defaultBatchedSenderGroupValidator } from "./batched-sender-group-rules.js";
import { BatchedSenderGroupStore } from "./batched-sender-group-store.js";

/** Moves batched sender groups through their life cycle and keeps a journal of what it did. */
export class BatchedSenderGroupDesk {
  store: BatchedSenderGroupStore;
  validator: BatchedSenderGroupValidator;
  clock: clock.Clock;
  journal: string[];
  engine: BatchedSenderGroupEngine;

  constructor(
    store: BatchedSenderGroupStore,
    validator: BatchedSenderGroupValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: BatchedSenderGroupEngine,
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
      throw new Error(`batched sender group ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("queued");
    this.store.save(item);
    this.note(`${code} is queued`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`batched sender group ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("failed");
    this.store.save(item);
    this.note(`${code} is failed: ${reason}`);
  }

  score(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`batched sender group ${code} not found`);
    }
    const result = this.engine.compute(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  reviewStale(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.createdAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newBatchedSenderGroupDesk(store: BatchedSenderGroupStore, clockValue: clock.Clock, flagsValue: flags.Registry): BatchedSenderGroupDesk {
  return new BatchedSenderGroupDesk(
    store,
    defaultBatchedSenderGroupValidator(),
    clockValue,
    [],
    defaultBatchedSenderGroupEngine(flagsValue),
  );
}
