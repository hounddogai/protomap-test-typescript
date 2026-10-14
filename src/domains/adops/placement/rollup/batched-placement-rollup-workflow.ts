import * as clock from "../../../../kit/clock.js";
import {
  BatchedPlacementRollupEngine,
  defaultBatchedPlacementRollupEngine,
} from "./batched-placement-rollup-engine.js";
import {
  BatchedPlacementRollupValidator,
  defaultBatchedPlacementRollupValidator,
} from "./batched-placement-rollup-rules.js";
import { BatchedPlacementRollupStore } from "./batched-placement-rollup-store.js";

/** Moves batched placement rollups through their life cycle and keeps a journal of what it did. */
export class BatchedPlacementRollupManager {
  store: BatchedPlacementRollupStore;
  validator: BatchedPlacementRollupValidator;
  clock: clock.Clock;
  journal: string[];
  engine: BatchedPlacementRollupEngine;

  constructor(
    store: BatchedPlacementRollupStore,
    validator: BatchedPlacementRollupValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: BatchedPlacementRollupEngine,
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
      throw new Error(`batched placement rollup ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("granted");
    this.store.save(item);
    this.note(`${code} is granted`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`batched placement rollup ${code} not found`);
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
      throw new Error(`batched placement rollup ${code} not found`);
    }
    const result = this.engine.price(item);
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

export function newBatchedPlacementRollupManager(store: BatchedPlacementRollupStore, clockValue: clock.Clock): BatchedPlacementRollupManager {
  return new BatchedPlacementRollupManager(
    store,
    defaultBatchedPlacementRollupValidator(),
    clockValue,
    [],
    defaultBatchedPlacementRollupEngine(),
  );
}
