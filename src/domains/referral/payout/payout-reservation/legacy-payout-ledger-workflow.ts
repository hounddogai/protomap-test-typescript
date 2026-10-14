import * as clock from "../../../../kit/clock.js";
import { LegacyPayoutLedgerEngine, defaultLegacyPayoutLedgerEngine } from "./legacy-payout-ledger-engine.js";
import { LegacyPayoutLedgerValidator, defaultLegacyPayoutLedgerValidator } from "./legacy-payout-ledger-rules.js";
import { LegacyPayoutLedgerStore } from "./legacy-payout-ledger-store.js";

/** Moves legacy payout ledgers through their life cycle and keeps a journal of what it did. */
export class LegacyPayoutLedgerCoordinator {
  store: LegacyPayoutLedgerStore;
  validator: LegacyPayoutLedgerValidator;
  clock: clock.Clock;
  journal: string[];
  engine: LegacyPayoutLedgerEngine;

  constructor(
    store: LegacyPayoutLedgerStore,
    validator: LegacyPayoutLedgerValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: LegacyPayoutLedgerEngine,
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
      throw new Error(`legacy payout ledger ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("approved");
    this.store.save(item);
    this.note(`${code} is approved`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`legacy payout ledger ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("withdrawn");
    this.store.save(item);
    this.note(`${code} is withdrawn: ${reason}`);
  }

  quote(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`legacy payout ledger ${code} not found`);
    }
    const result = this.engine.price(item);
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

export function newLegacyPayoutLedgerCoordinator(store: LegacyPayoutLedgerStore, clockValue: clock.Clock): LegacyPayoutLedgerCoordinator {
  return new LegacyPayoutLedgerCoordinator(
    store,
    defaultLegacyPayoutLedgerValidator(),
    clockValue,
    [],
    defaultLegacyPayoutLedgerEngine(),
  );
}
