import * as clock from "../../../../kit/clock.js";
import {
  CappedActivationLedgerEngine,
  defaultCappedActivationLedgerEngine,
} from "./capped-activation-ledger-engine.js";
import {
  CappedActivationLedgerValidator,
  defaultCappedActivationLedgerValidator,
} from "./capped-activation-ledger-rules.js";
import { CappedActivationLedgerStore } from "./capped-activation-ledger-store.js";

/** Moves capped activation ledgers through their life cycle and keeps a journal of what it did. */
export class CappedActivationLedgerDesk {
  store: CappedActivationLedgerStore;
  validator: CappedActivationLedgerValidator;
  clock: clock.Clock;
  journal: string[];
  engine: CappedActivationLedgerEngine;

  constructor(
    store: CappedActivationLedgerStore,
    validator: CappedActivationLedgerValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: CappedActivationLedgerEngine,
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
      throw new Error(`capped activation ledger ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("validated");
    this.store.save(item);
    this.note(`${code} is validated`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`capped activation ledger ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("retired");
    this.store.save(item);
    this.note(`${code} is retired: ${reason}`);
  }

  evaluate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`capped activation ledger ${code} not found`);
    }
    const result = this.engine.run(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  reviewStale(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.sendAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newCappedActivationLedgerDesk(store: CappedActivationLedgerStore, clockValue: clock.Clock): CappedActivationLedgerDesk {
  return new CappedActivationLedgerDesk(
    store,
    defaultCappedActivationLedgerValidator(),
    clockValue,
    [],
    defaultCappedActivationLedgerEngine(),
  );
}
