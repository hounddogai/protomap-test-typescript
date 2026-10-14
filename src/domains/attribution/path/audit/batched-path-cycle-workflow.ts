import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { BatchedPathCycleEngine, defaultBatchedPathCycleEngine } from "./batched-path-cycle-engine.js";
import { BatchedPathCycleValidator, defaultBatchedPathCycleValidator } from "./batched-path-cycle-rules.js";
import { BatchedPathCycleStore } from "./batched-path-cycle-store.js";

/** Moves batched path cycles through their life cycle and keeps a journal of what it did. */
export class BatchedPathCycleCoordinator {
  store: BatchedPathCycleStore;
  validator: BatchedPathCycleValidator;
  clock: clock.Clock;
  journal: string[];
  engine: BatchedPathCycleEngine;

  constructor(
    store: BatchedPathCycleStore,
    validator: BatchedPathCycleValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: BatchedPathCycleEngine,
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
      throw new Error(`batched path cycle ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("queued");
    this.store.save(item);
    this.note(`${code} is queued`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`batched path cycle ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("failed");
    this.store.save(item);
    this.note(`${code} is failed: ${reason}`);
  }

  quote(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`batched path cycle ${code} not found`);
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

export function newBatchedPathCycleCoordinator(store: BatchedPathCycleStore, clockValue: clock.Clock, flagsValue: flags.Registry): BatchedPathCycleCoordinator {
  return new BatchedPathCycleCoordinator(
    store,
    defaultBatchedPathCycleValidator(),
    clockValue,
    [],
    defaultBatchedPathCycleEngine(flagsValue),
  );
}
