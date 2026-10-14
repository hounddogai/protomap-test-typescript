import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { BatchedMentionLedgerEngine, defaultBatchedMentionLedgerEngine } from "./batched-mention-ledger-engine.js";
import {
  BatchedMentionLedgerValidator,
  defaultBatchedMentionLedgerValidator,
} from "./batched-mention-ledger-rules.js";
import { BatchedMentionLedgerStore } from "./batched-mention-ledger-store.js";

/** Moves batched mention ledgers through their life cycle and keeps a journal of what it did. */
export class BatchedMentionLedgerCoordinator {
  store: BatchedMentionLedgerStore;
  validator: BatchedMentionLedgerValidator;
  clock: clock.Clock;
  journal: string[];
  engine: BatchedMentionLedgerEngine;

  constructor(
    store: BatchedMentionLedgerStore,
    validator: BatchedMentionLedgerValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: BatchedMentionLedgerEngine,
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

  start(code: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`batched mention ledger ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("queued");
    this.store.save(item);
    this.note(`${code} is queued`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`batched mention ledger ${code} not found`);
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
      throw new Error(`batched mention ledger ${code} not found`);
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

export function newBatchedMentionLedgerCoordinator(store: BatchedMentionLedgerStore, clockValue: clock.Clock, flagsValue: flags.Registry): BatchedMentionLedgerCoordinator {
  return new BatchedMentionLedgerCoordinator(
    store,
    defaultBatchedMentionLedgerValidator(),
    clockValue,
    [],
    defaultBatchedMentionLedgerEngine(flagsValue),
  );
}
