import * as clock from "../../../../kit/clock.js";
import { StreakLedgerEngine, defaultStreakLedgerEngine } from "./streak-ledger-engine.js";
import { StreakLedgerValidator, defaultStreakLedgerValidator } from "./streak-ledger-rules.js";
import { StreakLedgerStore } from "./streak-ledger-store.js";

/** Moves streak ledgers through their life cycle and keeps a journal of what it did. */
export class StreakLedgerWorkflow {
  store: StreakLedgerStore;
  validator: StreakLedgerValidator;
  clock: clock.Clock;
  journal: string[];
  engine: StreakLedgerEngine;

  constructor(
    store: StreakLedgerStore,
    validator: StreakLedgerValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: StreakLedgerEngine,
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
      throw new Error(`streak ledger ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("approved");
    this.store.save(item);
    this.note(`${code} is approved`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`streak ledger ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("withdrawn");
    this.store.save(item);
    this.note(`${code} is withdrawn: ${reason}`);
  }

  estimate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`streak ledger ${code} not found`);
    }
    const result = this.engine.compute(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  reviewStale(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.endsAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newStreakLedgerWorkflow(store: StreakLedgerStore, clockValue: clock.Clock): StreakLedgerWorkflow {
  return new StreakLedgerWorkflow(store, defaultStreakLedgerValidator(), clockValue, [], defaultStreakLedgerEngine());
}
