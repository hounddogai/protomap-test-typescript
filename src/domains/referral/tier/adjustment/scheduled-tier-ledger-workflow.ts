import * as clock from "../../../../kit/clock.js";
import { ScheduledTierLedgerValidator, defaultScheduledTierLedgerValidator } from "./scheduled-tier-ledger-rules.js";
import { ScheduledTierLedgerStore } from "./scheduled-tier-ledger-store.js";

/** Moves scheduled tier ledgers through their life cycle and keeps a journal of what it did. */
export class ScheduledTierLedgerDesk {
  store: ScheduledTierLedgerStore;
  validator: ScheduledTierLedgerValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: ScheduledTierLedgerStore,
    validator: ScheduledTierLedgerValidator,
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
      throw new Error(`scheduled tier ledger ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("pending");
    this.store.save(item);
    this.note(`${code} is pending`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`scheduled tier ledger ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("closed");
    this.store.save(item);
    this.note(`${code} is closed: ${reason}`);
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

export function newScheduledTierLedgerDesk(store: ScheduledTierLedgerStore, clockValue: clock.Clock): ScheduledTierLedgerDesk {
  return new ScheduledTierLedgerDesk(store, defaultScheduledTierLedgerValidator(), clockValue, []);
}
