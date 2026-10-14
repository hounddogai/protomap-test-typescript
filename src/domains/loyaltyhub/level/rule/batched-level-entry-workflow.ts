import * as clock from "../../../../kit/clock.js";
import { BatchedLevelEntryEngine, defaultBatchedLevelEntryEngine } from "./batched-level-entry-engine.js";
import { BatchedLevelEntryValidator, defaultBatchedLevelEntryValidator } from "./batched-level-entry-rules.js";
import { BatchedLevelEntryStore } from "./batched-level-entry-store.js";

/** Moves batched level entries through their life cycle and keeps a journal of what it did. */
export class BatchedLevelEntryWorkflow {
  store: BatchedLevelEntryStore;
  validator: BatchedLevelEntryValidator;
  clock: clock.Clock;
  journal: string[];
  engine: BatchedLevelEntryEngine;

  constructor(
    store: BatchedLevelEntryStore,
    validator: BatchedLevelEntryValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: BatchedLevelEntryEngine,
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
      throw new Error(`batched level entry ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("granted");
    this.store.save(item);
    this.note(`${code} is granted`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`batched level entry ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("expired");
    this.store.save(item);
    this.note(`${code} is expired: ${reason}`);
  }

  quote(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`batched level entry ${code} not found`);
    }
    const result = this.engine.run(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  sweep(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.expiresAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newBatchedLevelEntryWorkflow(store: BatchedLevelEntryStore, clockValue: clock.Clock): BatchedLevelEntryWorkflow {
  return new BatchedLevelEntryWorkflow(
    store,
    defaultBatchedLevelEntryValidator(),
    clockValue,
    [],
    defaultBatchedLevelEntryEngine(),
  );
}
