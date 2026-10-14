import * as clock from "../../../../kit/clock.js";
import {
  SeasonalPaywallLedgerValidator,
  defaultSeasonalPaywallLedgerValidator,
} from "./seasonal-paywall-ledger-rules.js";
import { SeasonalPaywallLedgerStore } from "./seasonal-paywall-ledger-store.js";

/** Moves seasonal paywall ledgers through their life cycle and keeps a journal of what it did. */
export class SeasonalPaywallLedgerService {
  store: SeasonalPaywallLedgerStore;
  validator: SeasonalPaywallLedgerValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: SeasonalPaywallLedgerStore,
    validator: SeasonalPaywallLedgerValidator,
    clockValue: clock.Clock,
    journal: string[],
  ) {
    this.store = store;
    this.validator = validator;
    this.clock = clockValue;
    this.journal = journal;
  }

  private note(message: string): void {
    this.journal.push(`${this.clock.now()} ${message}`);
  }

  open(code: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`seasonal paywall ledger ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("validated");
    this.store.save(item);
    this.note(`${code} is validated`);
  }

  finish(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`seasonal paywall ledger ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("retired");
    this.store.save(item);
    this.note(`${code} is retired: ${reason}`);
  }

  audit(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.updatedAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newSeasonalPaywallLedgerService(store: SeasonalPaywallLedgerStore, clockValue: clock.Clock): SeasonalPaywallLedgerService {
  return new SeasonalPaywallLedgerService(store, defaultSeasonalPaywallLedgerValidator(), clockValue, []);
}
