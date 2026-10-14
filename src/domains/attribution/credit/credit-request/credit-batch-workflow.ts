import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { CreditBatchEngine, defaultCreditBatchEngine } from "./credit-batch-engine.js";
import { CreditBatchValidator, defaultCreditBatchValidator } from "./credit-batch-rules.js";
import { CreditBatchStore } from "./credit-batch-store.js";

/** Moves credit batches through their life cycle and keeps a journal of what it did. */
export class CreditBatchWorkflow {
  store: CreditBatchStore;
  validator: CreditBatchValidator;
  clock: clock.Clock;
  journal: string[];
  engine: CreditBatchEngine;

  constructor(
    store: CreditBatchStore,
    validator: CreditBatchValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: CreditBatchEngine,
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
      throw new Error(`credit batch ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("pending");
    this.store.save(item);
    this.note(`${code} is pending`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`credit batch ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("closed");
    this.store.save(item);
    this.note(`${code} is closed: ${reason}`);
  }

  estimate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`credit batch ${code} not found`);
    }
    const result = this.engine.compute(item);
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

export function newCreditBatchWorkflow(store: CreditBatchStore, clockValue: clock.Clock, flagsValue: flags.Registry): CreditBatchWorkflow {
  return new CreditBatchWorkflow(
    store,
    defaultCreditBatchValidator(),
    clockValue,
    [],
    defaultCreditBatchEngine(flagsValue),
  );
}
