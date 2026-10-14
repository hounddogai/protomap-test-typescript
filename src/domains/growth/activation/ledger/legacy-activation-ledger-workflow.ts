import * as clock from "../../../../kit/clock.js";
import {
  LegacyActivationLedgerEngine,
  defaultLegacyActivationLedgerEngine,
} from "./legacy-activation-ledger-engine.js";
import {
  LegacyActivationLedgerValidator,
  defaultLegacyActivationLedgerValidator,
} from "./legacy-activation-ledger-rules.js";
import { LegacyActivationLedgerStore } from "./legacy-activation-ledger-store.js";

/** Moves legacy activation ledgers through their life cycle and keeps a journal of what it did. */
export class LegacyActivationLedgerDesk {
  store: LegacyActivationLedgerStore;
  validator: LegacyActivationLedgerValidator;
  clock: clock.Clock;
  journal: string[];
  engine: LegacyActivationLedgerEngine;

  constructor(
    store: LegacyActivationLedgerStore,
    validator: LegacyActivationLedgerValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: LegacyActivationLedgerEngine,
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
      throw new Error(`legacy activation ledger ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("validated");
    this.store.save(item);
    this.note(`${code} is validated`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`legacy activation ledger ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("retired");
    this.store.save(item);
    this.note(`${code} is retired: ${reason}`);
  }

  estimate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`legacy activation ledger ${code} not found`);
    }
    const result = this.engine.compute(item);
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

export function newLegacyActivationLedgerDesk(store: LegacyActivationLedgerStore, clockValue: clock.Clock): LegacyActivationLedgerDesk {
  return new LegacyActivationLedgerDesk(
    store,
    defaultLegacyActivationLedgerValidator(),
    clockValue,
    [],
    defaultLegacyActivationLedgerEngine(),
  );
}
