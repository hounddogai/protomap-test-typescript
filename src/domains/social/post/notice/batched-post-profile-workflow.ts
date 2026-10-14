import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { BatchedPostProfileEngine, defaultBatchedPostProfileEngine } from "./batched-post-profile-engine.js";
import { BatchedPostProfileValidator, defaultBatchedPostProfileValidator } from "./batched-post-profile-rules.js";
import { BatchedPostProfileStore } from "./batched-post-profile-store.js";

/** Moves batched post profiles through their life cycle and keeps a journal of what it did. */
export class BatchedPostProfileWorkflow {
  store: BatchedPostProfileStore;
  validator: BatchedPostProfileValidator;
  clock: clock.Clock;
  journal: string[];
  engine: BatchedPostProfileEngine;

  constructor(
    store: BatchedPostProfileStore,
    validator: BatchedPostProfileValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: BatchedPostProfileEngine,
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
      throw new Error(`batched post profile ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("validated");
    this.store.save(item);
    this.note(`${code} is validated`);
  }

  finish(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`batched post profile ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("retired");
    this.store.save(item);
    this.note(`${code} is retired: ${reason}`);
  }

  estimate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`batched post profile ${code} not found`);
    }
    const result = this.engine.price(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  scan(cutoff: number): number {
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

export function newBatchedPostProfileWorkflow(store: BatchedPostProfileStore, clockValue: clock.Clock, flagsValue: flags.Registry): BatchedPostProfileWorkflow {
  return new BatchedPostProfileWorkflow(
    store,
    defaultBatchedPostProfileValidator(),
    clockValue,
    [],
    defaultBatchedPostProfileEngine(flagsValue),
  );
}
