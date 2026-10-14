import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { BatchedTierGroupEngine, defaultBatchedTierGroupEngine } from "./batched-tier-group-engine.js";
import { BatchedTierGroupValidator, defaultBatchedTierGroupValidator } from "./batched-tier-group-rules.js";
import { BatchedTierGroupStore } from "./batched-tier-group-store.js";

/** Moves batched tier groups through their life cycle and keeps a journal of what it did. */
export class BatchedTierGroupWorkflow {
  store: BatchedTierGroupStore;
  validator: BatchedTierGroupValidator;
  clock: clock.Clock;
  journal: string[];
  engine: BatchedTierGroupEngine;

  constructor(
    store: BatchedTierGroupStore,
    validator: BatchedTierGroupValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: BatchedTierGroupEngine,
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
      throw new Error(`batched tier group ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("warming");
    this.store.save(item);
    this.note(`${code} is warming`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`batched tier group ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("stopped");
    this.store.save(item);
    this.note(`${code} is stopped: ${reason}`);
  }

  evaluate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`batched tier group ${code} not found`);
    }
    const result = this.engine.run(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  scan(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.sendAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newBatchedTierGroupWorkflow(store: BatchedTierGroupStore, clockValue: clock.Clock, flagsValue: flags.Registry): BatchedTierGroupWorkflow {
  return new BatchedTierGroupWorkflow(
    store,
    defaultBatchedTierGroupValidator(),
    clockValue,
    [],
    defaultBatchedTierGroupEngine(flagsValue),
  );
}
