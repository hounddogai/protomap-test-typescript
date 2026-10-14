import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import {
  BatchedStreakExceptionEngine,
  defaultBatchedStreakExceptionEngine,
} from "./batched-streak-exception-engine.js";
import {
  BatchedStreakExceptionValidator,
  defaultBatchedStreakExceptionValidator,
} from "./batched-streak-exception-rules.js";
import { BatchedStreakExceptionStore } from "./batched-streak-exception-store.js";

/** Moves batched streak exceptions through their life cycle and keeps a journal of what it did. */
export class BatchedStreakExceptionService {
  store: BatchedStreakExceptionStore;
  validator: BatchedStreakExceptionValidator;
  clock: clock.Clock;
  journal: string[];
  engine: BatchedStreakExceptionEngine;

  constructor(
    store: BatchedStreakExceptionStore,
    validator: BatchedStreakExceptionValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: BatchedStreakExceptionEngine,
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
      throw new Error(`batched streak exception ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("warming");
    this.store.save(item);
    this.note(`${code} is warming`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`batched streak exception ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("stopped");
    this.store.save(item);
    this.note(`${code} is stopped: ${reason}`);
  }

  estimate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`batched streak exception ${code} not found`);
    }
    const result = this.engine.evaluate(item);
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

export function newBatchedStreakExceptionService(store: BatchedStreakExceptionStore, clockValue: clock.Clock, flagsValue: flags.Registry): BatchedStreakExceptionService {
  return new BatchedStreakExceptionService(
    store,
    defaultBatchedStreakExceptionValidator(),
    clockValue,
    [],
    defaultBatchedStreakExceptionEngine(flagsValue),
  );
}
