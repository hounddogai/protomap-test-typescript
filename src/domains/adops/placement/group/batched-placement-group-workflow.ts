import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { BatchedPlacementGroupEngine, defaultBatchedPlacementGroupEngine } from "./batched-placement-group-engine.js";
import {
  BatchedPlacementGroupValidator,
  defaultBatchedPlacementGroupValidator,
} from "./batched-placement-group-rules.js";
import { BatchedPlacementGroupStore } from "./batched-placement-group-store.js";

/** Moves batched placement groups through their life cycle and keeps a journal of what it did. */
export class BatchedPlacementGroupWorkflow {
  store: BatchedPlacementGroupStore;
  validator: BatchedPlacementGroupValidator;
  clock: clock.Clock;
  journal: string[];
  engine: BatchedPlacementGroupEngine;

  constructor(
    store: BatchedPlacementGroupStore,
    validator: BatchedPlacementGroupValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: BatchedPlacementGroupEngine,
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
      throw new Error(`batched placement group ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("approved");
    this.store.save(item);
    this.note(`${code} is approved`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`batched placement group ${code} not found`);
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
      throw new Error(`batched placement group ${code} not found`);
    }
    const result = this.engine.evaluate(item);
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

export function newBatchedPlacementGroupWorkflow(store: BatchedPlacementGroupStore, clockValue: clock.Clock, flagsValue: flags.Registry): BatchedPlacementGroupWorkflow {
  return new BatchedPlacementGroupWorkflow(
    store,
    defaultBatchedPlacementGroupValidator(),
    clockValue,
    [],
    defaultBatchedPlacementGroupEngine(flagsValue),
  );
}
