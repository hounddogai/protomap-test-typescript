import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { DefaultCreditLedgerEngine, defaultDefaultCreditLedgerEngine } from "./default-credit-ledger-engine.js";
import { DefaultCreditLedgerValidator, defaultDefaultCreditLedgerValidator } from "./default-credit-ledger-rules.js";
import { DefaultCreditLedgerStore } from "./default-credit-ledger-store.js";

/** Moves default credit ledgers through their life cycle and keeps a journal of what it did. */
export class DefaultCreditLedgerManager {
  store: DefaultCreditLedgerStore;
  validator: DefaultCreditLedgerValidator;
  clock: clock.Clock;
  journal: string[];
  engine: DefaultCreditLedgerEngine;

  constructor(
    store: DefaultCreditLedgerStore,
    validator: DefaultCreditLedgerValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: DefaultCreditLedgerEngine,
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
      throw new Error(`default credit ledger ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("approved");
    this.store.save(item);
    this.note(`${code} is approved`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`default credit ledger ${code} not found`);
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
      throw new Error(`default credit ledger ${code} not found`);
    }
    const result = this.engine.evaluate(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  audit(cutoff: number): number {
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

export function newDefaultCreditLedgerManager(store: DefaultCreditLedgerStore, clockValue: clock.Clock, flagsValue: flags.Registry): DefaultCreditLedgerManager {
  return new DefaultCreditLedgerManager(
    store,
    defaultDefaultCreditLedgerValidator(),
    clockValue,
    [],
    defaultDefaultCreditLedgerEngine(flagsValue),
  );
}
