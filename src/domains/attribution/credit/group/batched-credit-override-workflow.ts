import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { BatchedCreditOverrideEngine, defaultBatchedCreditOverrideEngine } from "./batched-credit-override-engine.js";
import {
  BatchedCreditOverrideValidator,
  defaultBatchedCreditOverrideValidator,
} from "./batched-credit-override-rules.js";
import { BatchedCreditOverrideStore } from "./batched-credit-override-store.js";

/** Moves batched credit overrides through their life cycle and keeps a journal of what it did. */
export class BatchedCreditOverrideWorkflow {
  store: BatchedCreditOverrideStore;
  validator: BatchedCreditOverrideValidator;
  clock: clock.Clock;
  journal: string[];
  engine: BatchedCreditOverrideEngine;

  constructor(
    store: BatchedCreditOverrideStore,
    validator: BatchedCreditOverrideValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: BatchedCreditOverrideEngine,
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
      throw new Error(`batched credit override ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("pending");
    this.store.save(item);
    this.note(`${code} is pending`);
  }

  close(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`batched credit override ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("closed");
    this.store.save(item);
    this.note(`${code} is closed: ${reason}`);
  }

  quote(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`batched credit override ${code} not found`);
    }
    const result = this.engine.run(item);
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

export function newBatchedCreditOverrideWorkflow(store: BatchedCreditOverrideStore, clockValue: clock.Clock, flagsValue: flags.Registry): BatchedCreditOverrideWorkflow {
  return new BatchedCreditOverrideWorkflow(
    store,
    defaultBatchedCreditOverrideValidator(),
    clockValue,
    [],
    defaultBatchedCreditOverrideEngine(flagsValue),
  );
}
