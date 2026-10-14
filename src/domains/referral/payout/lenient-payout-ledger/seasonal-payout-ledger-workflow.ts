import * as clock from "../../../../kit/clock.js";
import { SeasonalPayoutLedgerEngine, defaultSeasonalPayoutLedgerEngine } from "./seasonal-payout-ledger-engine.js";
import {
  SeasonalPayoutLedgerValidator,
  defaultSeasonalPayoutLedgerValidator,
} from "./seasonal-payout-ledger-rules.js";
import { SeasonalPayoutLedgerStore } from "./seasonal-payout-ledger-store.js";

/** Moves seasonal payout ledgers through their life cycle and keeps a journal of what it did. */
export class SeasonalPayoutLedgerCoordinator {
  store: SeasonalPayoutLedgerStore;
  validator: SeasonalPayoutLedgerValidator;
  clock: clock.Clock;
  journal: string[];
  engine: SeasonalPayoutLedgerEngine;

  constructor(
    store: SeasonalPayoutLedgerStore,
    validator: SeasonalPayoutLedgerValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: SeasonalPayoutLedgerEngine,
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
      throw new Error(`seasonal payout ledger ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("queued");
    this.store.save(item);
    this.note(`${code} is queued`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`seasonal payout ledger ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("failed");
    this.store.save(item);
    this.note(`${code} is failed: ${reason}`);
  }

  evaluate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`seasonal payout ledger ${code} not found`);
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

export function newSeasonalPayoutLedgerCoordinator(store: SeasonalPayoutLedgerStore, clockValue: clock.Clock): SeasonalPayoutLedgerCoordinator {
  return new SeasonalPayoutLedgerCoordinator(
    store,
    defaultSeasonalPayoutLedgerValidator(),
    clockValue,
    [],
    defaultSeasonalPayoutLedgerEngine(),
  );
}
