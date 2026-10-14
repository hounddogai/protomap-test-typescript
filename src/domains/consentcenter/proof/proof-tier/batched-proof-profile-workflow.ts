import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { BatchedProofProfileEngine, defaultBatchedProofProfileEngine } from "./batched-proof-profile-engine.js";
import { BatchedProofProfileValidator, defaultBatchedProofProfileValidator } from "./batched-proof-profile-rules.js";
import { BatchedProofProfileStore } from "./batched-proof-profile-store.js";

/** Moves batched proof profiles through their life cycle and keeps a journal of what it did. */
export class BatchedProofProfileWorkflow {
  store: BatchedProofProfileStore;
  validator: BatchedProofProfileValidator;
  clock: clock.Clock;
  journal: string[];
  engine: BatchedProofProfileEngine;

  constructor(
    store: BatchedProofProfileStore,
    validator: BatchedProofProfileValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: BatchedProofProfileEngine,
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
      throw new Error(`batched proof profile ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("scheduled");
    this.store.save(item);
    this.note(`${code} is scheduled`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`batched proof profile ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("cancelled");
    this.store.save(item);
    this.note(`${code} is cancelled: ${reason}`);
  }

  estimate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`batched proof profile ${code} not found`);
    }
    const result = this.engine.evaluate(item);
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

export function newBatchedProofProfileWorkflow(store: BatchedProofProfileStore, clockValue: clock.Clock, flagsValue: flags.Registry): BatchedProofProfileWorkflow {
  return new BatchedProofProfileWorkflow(
    store,
    defaultBatchedProofProfileValidator(),
    clockValue,
    [],
    defaultBatchedProofProfileEngine(flagsValue),
  );
}
