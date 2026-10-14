import * as clock from "../../../../kit/clock.js";
import { LegacySlaLedgerValidator, defaultLegacySlaLedgerValidator } from "./legacy-sla-ledger-rules.js";
import { LegacySlaLedgerStore } from "./legacy-sla-ledger-store.js";

/** Moves legacy sla ledgers through their life cycle and keeps a journal of what it did. */
export class LegacySlaLedgerManager {
  store: LegacySlaLedgerStore;
  validator: LegacySlaLedgerValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: LegacySlaLedgerStore,
    validator: LegacySlaLedgerValidator,
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

  advance(code: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`legacy sla ledger ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("approved");
    this.store.save(item);
    this.note(`${code} is approved`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`legacy sla ledger ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("withdrawn");
    this.store.save(item);
    this.note(`${code} is withdrawn: ${reason}`);
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

export function newLegacySlaLedgerManager(store: LegacySlaLedgerStore, clockValue: clock.Clock): LegacySlaLedgerManager {
  return new LegacySlaLedgerManager(store, defaultLegacySlaLedgerValidator(), clockValue, []);
}
