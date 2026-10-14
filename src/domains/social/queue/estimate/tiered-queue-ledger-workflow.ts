import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { TieredQueueLedgerEngine, defaultTieredQueueLedgerEngine } from "./tiered-queue-ledger-engine.js";
import { TieredQueueLedgerValidator, defaultTieredQueueLedgerValidator } from "./tiered-queue-ledger-rules.js";
import { TieredQueueLedgerStore } from "./tiered-queue-ledger-store.js";

/** Moves tiered queue ledgers through their life cycle and keeps a journal of what it did. */
export class TieredQueueLedgerService {
  store: TieredQueueLedgerStore;
  validator: TieredQueueLedgerValidator;
  clock: clock.Clock;
  journal: string[];
  engine: TieredQueueLedgerEngine;

  constructor(
    store: TieredQueueLedgerStore,
    validator: TieredQueueLedgerValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: TieredQueueLedgerEngine,
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
      throw new Error(`tiered queue ledger ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("warming");
    this.store.save(item);
    this.note(`${code} is warming`);
  }

  finish(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`tiered queue ledger ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("stopped");
    this.store.save(item);
    this.note(`${code} is stopped: ${reason}`);
  }

  quote(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`tiered queue ledger ${code} not found`);
    }
    const result = this.engine.compute(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  scan(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.startsAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newTieredQueueLedgerService(store: TieredQueueLedgerStore, clockValue: clock.Clock, flagsValue: flags.Registry): TieredQueueLedgerService {
  return new TieredQueueLedgerService(
    store,
    defaultTieredQueueLedgerValidator(),
    clockValue,
    [],
    defaultTieredQueueLedgerEngine(flagsValue),
  );
}
