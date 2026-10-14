import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { DeflectionLedgerEngine, defaultDeflectionLedgerEngine } from "./deflection-ledger-engine.js";
import { DeflectionLedgerValidator, defaultDeflectionLedgerValidator } from "./deflection-ledger-rules.js";
import { DeflectionLedgerStore } from "./deflection-ledger-store.js";

/** Moves deflection ledgers through their life cycle and keeps a journal of what it did. */
export class DeflectionLedgerManager {
  store: DeflectionLedgerStore;
  validator: DeflectionLedgerValidator;
  clock: clock.Clock;
  journal: string[];
  engine: DeflectionLedgerEngine;

  constructor(
    store: DeflectionLedgerStore,
    validator: DeflectionLedgerValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: DeflectionLedgerEngine,
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
      throw new Error(`deflection ledger ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("approved");
    this.store.save(item);
    this.note(`${code} is approved`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`deflection ledger ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("withdrawn");
    this.store.save(item);
    this.note(`${code} is withdrawn: ${reason}`);
  }

  score(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`deflection ledger ${code} not found`);
    }
    const result = this.engine.price(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  scan(cutoff: number): number {
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

export function newDeflectionLedgerManager(store: DeflectionLedgerStore, clockValue: clock.Clock, flagsValue: flags.Registry): DeflectionLedgerManager {
  return new DeflectionLedgerManager(
    store,
    defaultDeflectionLedgerValidator(),
    clockValue,
    [],
    defaultDeflectionLedgerEngine(flagsValue),
  );
}
