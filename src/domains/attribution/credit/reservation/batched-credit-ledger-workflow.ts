import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { BatchedCreditLedgerEngine, defaultBatchedCreditLedgerEngine } from "./batched-credit-ledger-engine.js";
import { BatchedCreditLedgerValidator, defaultBatchedCreditLedgerValidator } from "./batched-credit-ledger-rules.js";
import { BatchedCreditLedgerStore } from "./batched-credit-ledger-store.js";

/** Moves batched credit ledgers through their life cycle and keeps a journal of what it did. */
export class BatchedCreditLedgerManager {
  store: BatchedCreditLedgerStore;
  validator: BatchedCreditLedgerValidator;
  clock: clock.Clock;
  journal: string[];
  engine: BatchedCreditLedgerEngine;

  constructor(
    store: BatchedCreditLedgerStore,
    validator: BatchedCreditLedgerValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: BatchedCreditLedgerEngine,
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
      throw new Error(`batched credit ledger ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("pending");
    this.store.save(item);
    this.note(`${code} is pending`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`batched credit ledger ${code} not found`);
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
      throw new Error(`batched credit ledger ${code} not found`);
    }
    const result = this.engine.evaluate(item);
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

export function newBatchedCreditLedgerManager(store: BatchedCreditLedgerStore, clockValue: clock.Clock, flagsValue: flags.Registry): BatchedCreditLedgerManager {
  return new BatchedCreditLedgerManager(
    store,
    defaultBatchedCreditLedgerValidator(),
    clockValue,
    [],
    defaultBatchedCreditLedgerEngine(flagsValue),
  );
}
