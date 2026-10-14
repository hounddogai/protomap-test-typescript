import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import {
  BatchedActivationWindowEngine,
  defaultBatchedActivationWindowEngine,
} from "./batched-activation-window-engine.js";
import {
  BatchedActivationWindowValidator,
  defaultBatchedActivationWindowValidator,
} from "./batched-activation-window-rules.js";
import { BatchedActivationWindowStore } from "./batched-activation-window-store.js";

/** Moves batched activation windows through their life cycle and keeps a journal of what it did. */
export class BatchedActivationWindowWorkflow {
  store: BatchedActivationWindowStore;
  validator: BatchedActivationWindowValidator;
  clock: clock.Clock;
  journal: string[];
  engine: BatchedActivationWindowEngine;

  constructor(
    store: BatchedActivationWindowStore,
    validator: BatchedActivationWindowValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: BatchedActivationWindowEngine,
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
      throw new Error(`batched activation window ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("pending");
    this.store.save(item);
    this.note(`${code} is pending`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`batched activation window ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("closed");
    this.store.save(item);
    this.note(`${code} is closed: ${reason}`);
  }

  evaluate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`batched activation window ${code} not found`);
    }
    const result = this.engine.price(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  sweep(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.updatedAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newBatchedActivationWindowWorkflow(store: BatchedActivationWindowStore, clockValue: clock.Clock, flagsValue: flags.Registry): BatchedActivationWindowWorkflow {
  return new BatchedActivationWindowWorkflow(
    store,
    defaultBatchedActivationWindowValidator(),
    clockValue,
    [],
    defaultBatchedActivationWindowEngine(flagsValue),
  );
}
