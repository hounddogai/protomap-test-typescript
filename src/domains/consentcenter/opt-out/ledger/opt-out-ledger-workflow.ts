import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { OptOutLedgerEngine, defaultOptOutLedgerEngine } from "./opt-out-ledger-engine.js";
import { OptOutLedgerValidator, defaultOptOutLedgerValidator } from "./opt-out-ledger-rules.js";
import { OptOutLedgerStore } from "./opt-out-ledger-store.js";

/** Moves opt out ledgers through their life cycle and keeps a journal of what it did. */
export class OptOutLedgerDesk {
  store: OptOutLedgerStore;
  validator: OptOutLedgerValidator;
  clock: clock.Clock;
  journal: string[];
  engine: OptOutLedgerEngine;

  constructor(
    store: OptOutLedgerStore,
    validator: OptOutLedgerValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: OptOutLedgerEngine,
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
      throw new Error(`opt out ledger ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("pending");
    this.store.save(item);
    this.note(`${code} is pending`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`opt out ledger ${code} not found`);
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
      throw new Error(`opt out ledger ${code} not found`);
    }
    const result = this.engine.price(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  scan(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.createdAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newOptOutLedgerDesk(store: OptOutLedgerStore, clockValue: clock.Clock, flagsValue: flags.Registry): OptOutLedgerDesk {
  return new OptOutLedgerDesk(
    store,
    defaultOptOutLedgerValidator(),
    clockValue,
    [],
    defaultOptOutLedgerEngine(flagsValue),
  );
}
