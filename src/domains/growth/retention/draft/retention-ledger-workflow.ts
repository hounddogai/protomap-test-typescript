import * as clock from "../../../../kit/clock.js";
import { RetentionLedgerEngine, defaultRetentionLedgerEngine } from "./retention-ledger-engine.js";
import { RetentionLedgerValidator, defaultRetentionLedgerValidator } from "./retention-ledger-rules.js";
import { RetentionLedgerStore } from "./retention-ledger-store.js";

/** Moves retention ledgers through their life cycle and keeps a journal of what it did. */
export class RetentionLedgerManager {
  store: RetentionLedgerStore;
  validator: RetentionLedgerValidator;
  clock: clock.Clock;
  journal: string[];
  engine: RetentionLedgerEngine;

  constructor(
    store: RetentionLedgerStore,
    validator: RetentionLedgerValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: RetentionLedgerEngine,
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
      throw new Error(`retention ledger ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("warming");
    this.store.save(item);
    this.note(`${code} is warming`);
  }

  close(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`retention ledger ${code} not found`);
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
      throw new Error(`retention ledger ${code} not found`);
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

export function newRetentionLedgerManager(store: RetentionLedgerStore, clockValue: clock.Clock): RetentionLedgerManager {
  return new RetentionLedgerManager(
    store,
    defaultRetentionLedgerValidator(),
    clockValue,
    [],
    defaultRetentionLedgerEngine(),
  );
}
